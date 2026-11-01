import os
import sys
# Ensure repository root is on sys.path for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


from ml.predict import predict_entry, get_active_version
from ml.retrain import run_retraining, acquire_lock, release_lock, MODELS_DIR
from ml.train_model import rollback_model_version, ACTIVE_MODEL_DIR
from ml.dataset import compute_dataset_summary

app = FastAPI(
    title="ManoboLit Machine Learning Classification Service",
    description="Scikit-learn inference, honest evaluation, automatic retraining, and model versioning for Agusan Manobo literature",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    title: Optional[str] = None
    manoboTitle: Optional[str] = None
    englishTitle: Optional[str] = None
    transcription: Optional[str] = None
    translation: Optional[str] = None
    content: Optional[str] = None
    text: Optional[str] = None
    uncertaintyThreshold: Optional[float] = 0.45

class RetrainRequest(BaseModel):
    trigger: Optional[str] = "MANUAL"
    force: Optional[bool] = False
    entries: Optional[List[Dict[str, Any]]] = None

@app.get("/health")
def health_check():
    active_ver = get_active_version()
    is_ml_active = active_ver != "rules-baseline" and os.path.exists(os.path.join(ACTIVE_MODEL_DIR, "pipeline.joblib"))
    return {
        "status": "healthy",
        "service": "ManoboLit-ML",
        "active_version": active_ver,
        "is_ml_active": is_ml_active,
        "mode": "MACHINE_LEARNING" if is_ml_active else "RULE_BASED_BASELINE"
    }

@app.post("/predict")
def predict(req: PredictRequest):
    # Combine fields if provided as entry object, or use single text string
    input_data = req.dict()
    if req.text and not any([req.title, req.transcription, req.content]):
        input_data = req.text
    result = predict_entry(input_data, uncertainty_threshold=req.uncertaintyThreshold or 0.45)
    return result

@app.post("/retrain")
def trigger_retrain(req: RetrainRequest, background_tasks: BackgroundTasks):
    """
    Triggers an automated retraining run.
    Validates eligible verified entries, trains candidate models,
    evaluates conditional promotion criteria, and updates the active model if passed.
    """
    # Run synchronously to give immediate feedback if requested, or in background
    res = run_retraining(entries=req.entries, trigger=req.trigger or "MANUAL", force=bool(req.force))
    return res

@app.get("/models")
def list_models():
    """
    Lists all model versions in the registry, their metadata, validation metrics,
    and the currently active version.
    """
    active_ver = get_active_version()
    models = []

    # Rule baseline entry
    models.append({
        "version": "rules-baseline",
        "algorithm": "DomainExpertRules",
        "isActive": active_ver == "rules-baseline",
        "metrics": {"source": "Eugenio (1993) & Andress (1985) taxonomies"},
        "promotionReason": "Operational fallback baseline"
    })

    if os.path.exists(MODELS_DIR):
        for item in os.listdir(MODELS_DIR):
            item_path = os.path.join(MODELS_DIR, item)
            if os.path.isdir(item_path) and item not in ("active", "snapshots", "jobs"):
                meta_path = os.path.join(item_path, "metadata.json")
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path, "r", encoding="utf-8") as f:
                            meta = json.load(f)
                        meta["isActive"] = (item == active_ver)
                        models.append(meta)
                    except Exception:
                        pass

    return {
        "active_version": active_ver,
        "models": models
    }

@app.post("/models/{version}/activate")
def activate_version(version: str):
    """
    Rolls back or activates a specific model version atomically.
    """
    success, msg = rollback_model_version(version)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {
        "success": True,
        "active_version": get_active_version(),
        "message": msg
    }

@app.post("/dataset/summary")
def get_dataset_summary(entries: List[Dict[str, Any]]):
    """
    Summarizes human verification status and checks training sufficiency.
    """
    return compute_dataset_summary(entries)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.server:app", host="127.0.0.1", port=8000, reload=False)
