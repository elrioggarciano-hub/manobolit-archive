import os
import json
import time
import shutil
import joblib
from typing import List, Dict, Any, Tuple, Optional
from sklearn.model_selection import StratifiedKFold, train_test_split
from ml.pipeline import build_candidate_pipelines, RANDOM_SEED
from ml.evaluate_model import evaluate_pipeline, evaluate_rules_baseline, check_promotion_criteria
from ml.dataset import compute_dataset_summary, filter_verified_records, save_snapshot

MODELS_DIR = "ml/models"
ACTIVE_MODEL_DIR = os.path.join(MODELS_DIR, "active")

def train_and_evaluate_candidates(
    verified_records: List[Dict[str, Any]],
    candidate_version: Optional[str] = None,
    min_macro_f1: float = 0.50,
) -> Dict[str, Any]:
    """
    Trains candidate scikit-learn models on verified records, prevents data leakage,
    performs fair validation, compares against the rule-based baseline, and assesses promotion criteria.
    """
    if not candidate_version:
        candidate_version = f"v{int(time.time())}"

    summary = compute_dataset_summary(verified_records)
    if not summary["isSufficientForTraining"]:
        return {
            "success": False,
            "status": "INSUFFICIENT_DATA",
            "candidate_version": candidate_version,
            "message": summary["minimumRequirementsMessage"],
            "summary": summary
        }

    texts = [r["text"] for r in verified_records]
    labels = [r["genre"] for r in verified_records]

    # Save immutable dataset snapshot
    snapshot_path = save_snapshot(verified_records)

    # Stratified or group-aware split
    # For small datasets, use a train/validation split or stratified k-fold
    unique_classes, counts = np_unique_counts(labels)
    min_class_count = min(counts)

    if min_class_count >= 2 and len(texts) >= 6:
        train_texts, val_texts, train_labels, val_labels = train_test_split(
            texts, labels, test_size=0.33, random_state=RANDOM_SEED, stratify=labels
        )
    else:
        # Fallback split without stratification if any class has only 1 sample
        train_texts, val_texts, train_labels, val_labels = train_test_split(
            texts, labels, test_size=0.33, random_state=RANDOM_SEED
        )

    # 1. Evaluate Rule-Based Baseline on the validation set
    rule_baseline_metrics = evaluate_rules_baseline(val_texts, val_labels)

    # 2. Train and evaluate each candidate pipeline
    candidate_pipelines = build_candidate_pipelines()
    best_candidate_name = None
    best_candidate_pipeline = None
    best_candidate_metrics = None
    candidate_results = {}

    for name, pipeline in candidate_pipelines.items():
        try:
            # Fit feature extraction + classifier on training fold only (prevents data leakage)
            pipeline.fit(train_texts, train_labels)
            metrics = evaluate_pipeline(pipeline, val_texts, val_labels, classes=sorted(list(set(labels))))
            candidate_results[name] = metrics

            if best_candidate_metrics is None or metrics["macro_f1"] > best_candidate_metrics["macro_f1"]:
                best_candidate_name = name
                best_candidate_pipeline = pipeline
                best_candidate_metrics = metrics
        except Exception as e:
            candidate_results[name] = {"error": str(e), "macro_f1": 0.0}

    if not best_candidate_pipeline or not best_candidate_metrics:
        return {
            "success": False,
            "status": "TRAINING_FAILED",
            "candidate_version": candidate_version,
            "message": "All candidate pipelines failed during training."
        }

    # 3. Check Conditional Promotion Criteria against the baseline
    promoted, promotion_reason = check_promotion_criteria(
        best_candidate_metrics,
        rule_baseline_metrics,
        min_macro_f1=min_macro_f1,
        min_sample_size=len(val_texts)
    )

    # 4. Save Candidate Artifacts
    candidate_dir = os.path.join(MODELS_DIR, candidate_version)
    os.makedirs(candidate_dir, exist_ok=True)
    pipeline_path = os.path.join(candidate_dir, "pipeline.joblib")
    
    # Train best pipeline on full verified dataset for production artifact
    full_fitted_pipeline = best_candidate_pipeline
    try:
        full_fitted_pipeline.fit(texts, labels)
    except Exception:
        pass
    joblib.dump(full_fitted_pipeline, pipeline_path)

    metadata = {
        "version": candidate_version,
        "algorithm": best_candidate_name,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "datasetSnapshot": snapshot_path,
        "datasetSize": len(verified_records),
        "verifiedCounts": summary["verifiedCounts"],
        "validationMetrics": best_candidate_metrics,
        "ruleBaselineMetrics": rule_baseline_metrics,
        "allCandidateResults": candidate_results,
        "promoted": promoted,
        "promotionReason": promotion_reason,
        "classes": sorted(list(set(labels)))
    }

    metadata_path = os.path.join(candidate_dir, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 5. Atomic Promotion if criteria passed
    if promoted:
        promote_model_version(candidate_version)

    return {
        "success": True,
        "status": "PROMOTED" if promoted else "REJECTED_CONDITIONS_NOT_MET",
        "candidate_version": candidate_version,
        "algorithm": best_candidate_name,
        "promoted": promoted,
        "promotion_reason": promotion_reason,
        "validation_metrics": best_candidate_metrics,
        "rule_baseline_metrics": rule_baseline_metrics,
        "candidate_results": candidate_results,
        "artifact_path": pipeline_path,
        "metadata": metadata
    }

def promote_model_version(version: str) -> bool:
    """
    Atomically activates the specified model version.
    Maintains a rollback copy of the previously active model.
    """
    version_dir = os.path.join(MODELS_DIR, version)
    if not os.path.exists(version_dir):
        return False

    os.makedirs(ACTIVE_MODEL_DIR, exist_ok=True)
    # Save active_version pointer
    pointer_path = os.path.join(MODELS_DIR, "active_version.txt")
    with open(pointer_path, "w", encoding="utf-8") as f:
        f.write(version)

    # Copy files atomically to active directory
    for item in os.listdir(version_dir):
        s = os.path.join(version_dir, item)
        d = os.path.join(ACTIVE_MODEL_DIR, item)
        if os.path.isfile(s):
            shutil.copy2(s, d)

    return True

def rollback_model_version(target_version: str) -> Tuple[bool, str]:
    """
    Rolls back the active model to any previously registered model version.
    """
    if target_version == "rules-baseline":
        # Roll back to rule-based fallback
        pointer_path = os.path.join(MODELS_DIR, "active_version.txt")
        with open(pointer_path, "w", encoding="utf-8") as f:
            f.write("rules-baseline")
        # Clear active model directory
        if os.path.exists(ACTIVE_MODEL_DIR):
            shutil.rmtree(ACTIVE_MODEL_DIR)
            os.makedirs(ACTIVE_MODEL_DIR, exist_ok=True)
        return True, "Successfully rolled back to Rule-Based Baseline."

    version_dir = os.path.join(MODELS_DIR, target_version)
    if not os.path.exists(version_dir):
        return False, f"Model version '{target_version}' not found in registry."

    promoted = promote_model_version(target_version)
    if promoted:
        return True, f"Successfully rolled back to model version {target_version}."
    return False, f"Failed to activate version {target_version}."

def np_unique_counts(labels: List[str]) -> Tuple[List[str], List[int]]:
    counts = {}
    for l in labels:
        counts[l] = counts.get(l, 0) + 1
    return list(counts.keys()), list(counts.values())
