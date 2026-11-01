import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score
from ml.rules_classifier import classify_with_rules

def evaluate_pipeline(
    pipeline: Any,
    texts: List[str],
    true_labels: List[str],
    classes: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Evaluates a trained scikit-learn pipeline on verified texts and true labels.
    Computes macro-F1, accuracy, per-class metrics, confusion matrix, and prediction probabilities.
    """
    if len(texts) == 0 or len(true_labels) == 0:
        return {
            "error": "Empty evaluation dataset",
            "macro_f1": 0.0,
            "accuracy": 0.0,
            "sample_size": 0,
            "per_class": {},
            "confusion_matrix": []
        }

    preds = pipeline.predict(texts)
    
    # Calculate calibrated probabilities if supported
    probs = None
    if hasattr(pipeline, "predict_proba"):
        probs = pipeline.predict_proba(texts)

    eval_classes = sorted(list(set(true_labels + list(preds))))
    if classes:
        eval_classes = [c for c in classes if c in set(true_labels + list(preds))]

    macro_f1 = f1_score(true_labels, preds, average="macro", zero_division=0)
    acc = accuracy_score(true_labels, preds)
    conf_mat = confusion_matrix(true_labels, preds, labels=eval_classes).tolist()
    report = classification_report(true_labels, preds, labels=eval_classes, output_dict=True, zero_division=0)

    per_class = {}
    for c in eval_classes:
        if c in report:
            per_class[c] = {
                "precision": round(report[c]["precision"], 4),
                "recall": round(report[c]["recall"], 4),
                "f1_score": round(report[c]["f1-score"], 4),
                "support": report[c]["support"],
            }

    return {
        "macro_f1": round(float(macro_f1), 4),
        "accuracy": round(float(acc), 4),
        "sample_size": len(texts),
        "classes": eval_classes,
        "per_class": per_class,
        "confusion_matrix": conf_mat,
    }

def evaluate_rules_baseline(texts: List[str], true_labels: List[str]) -> Dict[str, Any]:
    """
    Evaluates the domain expert rule-based classifier on the exact same verified evaluation examples.
    Provides a standardized baseline for comparison and candidate promotion.
    """
    if len(texts) == 0 or len(true_labels) == 0:
        return {
            "macro_f1": 0.0,
            "accuracy": 0.0,
            "sample_size": 0,
            "per_class": {},
            "confusion_matrix": []
        }

    preds = []
    uncertain_count = 0
    for t in texts:
        res = classify_with_rules(t)
        preds.append(res["predicted_genre"])
        if res.get("is_uncertain"):
            uncertain_count += 1

    eval_classes = sorted(list(set(true_labels + preds)))
    macro_f1 = f1_score(true_labels, preds, average="macro", zero_division=0)
    acc = accuracy_score(true_labels, preds)
    conf_mat = confusion_matrix(true_labels, preds, labels=eval_classes).tolist()
    report = classification_report(true_labels, preds, labels=eval_classes, output_dict=True, zero_division=0)

    per_class = {}
    for c in eval_classes:
        if c in report:
            per_class[c] = {
                "precision": round(report[c]["precision"], 4),
                "recall": round(report[c]["recall"], 4),
                "f1_score": round(report[c]["f1-score"], 4),
                "support": report[c]["support"],
            }

    return {
        "macro_f1": round(float(macro_f1), 4),
        "accuracy": round(float(acc), 4),
        "sample_size": len(texts),
        "uncertain_cases": uncertain_count,
        "classes": eval_classes,
        "per_class": per_class,
        "confusion_matrix": conf_mat,
    }

def check_promotion_criteria(
    candidate_metrics: Dict[str, Any],
    baseline_metrics: Dict[str, Any],
    min_macro_f1: float = 0.60,
    min_sample_size: int = 4
) -> Tuple[bool, str]:
    """
    Documented conditional promotion checks:
    1. Sample size check: must have at least min_sample_size verified evaluation examples.
    2. Absolute threshold: candidate macro-F1 must be >= min_macro_f1.
    3. Relative threshold: candidate macro-F1 must be >= baseline (active model or rule baseline).
    4. Safety check: candidate must not collapse any category with >= 2 examples to 0 recall.
    """
    sample_size = candidate_metrics.get("sample_size", 0)
    if sample_size < min_sample_size:
        return False, f"Evaluation sample size ({sample_size}) is insufficient for automatic activation (minimum: {min_sample_size})."

    cand_f1 = candidate_metrics.get("macro_f1", 0.0)
    base_f1 = baseline_metrics.get("macro_f1", 0.0)

    if cand_f1 < min_macro_f1:
        return False, f"Candidate macro-F1 ({cand_f1:.2f}) does not meet the minimum required threshold of {min_macro_f1:.2f}."

    if cand_f1 < base_f1:
        return False, f"Candidate macro-F1 ({cand_f1:.2f}) does not outperform active baseline ({base_f1:.2f}). Retaining current model."

    # Check for severe class degradation
    cand_per_class = candidate_metrics.get("per_class", {})
    for cls_name, stats in cand_per_class.items():
        if stats.get("support", 0) >= 2 and stats.get("recall", 0.0) == 0.0:
            return False, f"Candidate collapsed recall to 0.0 on category '{cls_name}'. Promotion aborted."

    return True, f"Passed all checks: Candidate macro-F1 ({cand_f1:.2f}) >= baseline ({base_f1:.2f}) with balanced recall."
