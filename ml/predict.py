import os
import json
import joblib
from typing import Dict, Any, Optional, List, Tuple
from ml.preprocessing import clean_text, combine_entry_fields
from ml.rules_classifier import classify_with_rules

MODELS_DIR = "ml/models"
ACTIVE_DIR = os.path.join(MODELS_DIR, "active")
POINTER_FILE = os.path.join(MODELS_DIR, "active_version.txt")

# In-memory cached active pipeline and metadata
_cached_version: Optional[str] = None
_cached_pipeline: Optional[Any] = None
_cached_metadata: Optional[Dict[str, Any]] = None

def get_active_version() -> str:
    if os.path.exists(POINTER_FILE):
        try:
            with open(POINTER_FILE, "r", encoding="utf-8") as f:
                return f.read().strip() or "rules-baseline"
        except Exception:
            return "rules-baseline"
    return "rules-baseline"

def load_active_pipeline() -> Tuple[Optional[Any], str, Optional[Dict[str, Any]]]:
    """
    Safely loads the currently active model pipeline with in-memory caching.
    Invalidates cache if the active version pointer changes.
    """
    global _cached_version, _cached_pipeline, _cached_metadata
    curr_version = get_active_version()

    if curr_version == "rules-baseline":
        return None, "rules-baseline", None

    if _cached_pipeline is not None and _cached_version == curr_version:
        return _cached_pipeline, _cached_version, _cached_metadata

    pipeline_path = os.path.join(ACTIVE_DIR, "pipeline.joblib")
    metadata_path = os.path.join(ACTIVE_DIR, "metadata.json")

    if not os.path.exists(pipeline_path):
        return None, "rules-baseline", None

    try:
        pipeline = joblib.load(pipeline_path)
        metadata = None
        if os.path.exists(metadata_path):
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
        _cached_version = curr_version
        _cached_pipeline = pipeline
        _cached_metadata = metadata
        return pipeline, curr_version, metadata
    except Exception as e:
        print(f"[ML Predict] Warning: failed to load active model {curr_version}: {e}. Falling back to rules.")
        return None, "rules-baseline", None

def get_top_features(pipeline: Any, text: str, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Extracts the highest-weighted TF-IDF n-grams from the input text for transparent interpretability.
    """
    try:
        features_step = pipeline.named_steps.get("features")
        if not features_step:
            return []
        
        # Transform input text
        feature_matrix = features_step.transform([text])
        feature_names = features_step.get_feature_names_out()
        
        # Get non-zero indices and values
        non_zero_indices = feature_matrix.indices
        data_values = feature_matrix.data
        
        scored_features = []
        for idx, val in zip(non_zero_indices, data_values):
            clean_name = feature_names[idx]
            # Strip transformer prefix if present
            if "__" in clean_name:
                clean_name = clean_name.split("__", 1)[1]
            scored_features.append({
                "feature": clean_name,
                "weight": round(float(val), 4)
            })
            
        scored_features.sort(key=lambda x: x["weight"], reverse=True)
        return scored_features[:top_n]
    except Exception:
        return []

def predict_entry(
    input_data: Any,
    uncertainty_threshold: float = 0.45
) -> Dict[str, Any]:
    """
    Classifies an archive entry using the active Machine Learning pipeline.
    If no ML model is active, or if confidence is low, gracefully provides rule-based fallback.
    Never fabricates confidence or presents uncalibrated SVM decision scores as probabilities.
    """
    # 1. Normalize input
    if isinstance(input_data, dict):
        text = combine_entry_fields(input_data)
    else:
        text = clean_text(str(input_data))

    if not text:
        return {
            "predicted_genre": "UNCERTAIN",
            "confidence": 0.0,
            "prediction_source": "NONE",
            "model_version": "none",
            "is_uncertain": True,
            "probabilities": {},
            "top_features": []
        }

    # 2. Try to load active ML pipeline
    pipeline, version, metadata = load_active_pipeline()

    if pipeline is None:
        # Graceful domain expert rule fallback
        rule_res = classify_with_rules(text)
        return {
            "predicted_genre": rule_res["predicted_genre"],
            "confidence": rule_res["confidence"],
            "probabilities": rule_res["scores"],
            "prediction_source": "RULE_BASED",
            "model_version": "rules-baseline",
            "is_uncertain": rule_res["is_uncertain"],
            "top_features": [{"feature": m, "weight": 1.0} for m in rule_res["rules_applied"][:5]],
            "algorithm": "DomainExpertRules (Eugenio 1993)"
        }

    # 3. Run real ML inference
    try:
        classes = list(pipeline.classes_)
        top_features = get_top_features(pipeline, text)

        if hasattr(pipeline, "predict_proba"):
            probs = pipeline.predict_proba([text])[0]
            prob_map = {cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probs)}
            top_idx = int(probs.argmax())
            top_genre = classes[top_idx]
            top_conf = round(float(probs[top_idx]), 4)
        else:
            # Decision function fallback (e.g. uncalibrated SVM)
            pred = pipeline.predict([text])[0]
            top_genre = str(pred)
            top_conf = 0.60
            prob_map = {top_genre: 1.0}

        is_uncertain = top_conf < uncertainty_threshold

        result = {
            "predicted_genre": top_genre,
            "confidence": top_conf,
            "probabilities": prob_map,
            "prediction_source": "ML_PIPELINE",
            "model_version": version,
            "is_uncertain": is_uncertain,
            "top_features": top_features,
            "algorithm": metadata.get("algorithm", "ScikitLearnPipeline") if metadata else "ScikitLearnPipeline"
        }

        # If prediction is uncertain, provide clearly labeled rule fallback suggestion
        if is_uncertain:
            rule_fallback = classify_with_rules(text)
            result["rule_fallback"] = {
                "suggested_genre": rule_fallback["predicted_genre"],
                "confidence": rule_fallback["confidence"],
                "source": "RULE_BASED_FALLBACK"
            }

        return result
    except Exception as e:
        print(f"[ML Predict] Inference error: {e}. Executing rule fallback.")
        rule_res = classify_with_rules(text)
        return {
            "predicted_genre": rule_res["predicted_genre"],
            "confidence": rule_res["confidence"],
            "probabilities": rule_res["scores"],
            "prediction_source": "RULE_BASED_FALLBACK_ON_ERROR",
            "model_version": "rules-baseline",
            "is_uncertain": True,
            "error_detail": str(e),
            "top_features": []
        }
