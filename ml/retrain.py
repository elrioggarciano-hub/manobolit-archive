import os
import sys
# Ensure repository root is on sys.path for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import time
import requests

from typing import Dict, Any, Optional, List
from ml.dataset import filter_verified_records, compute_dataset_summary
from ml.train_model import train_and_evaluate_candidates, MODELS_DIR

LOCK_FILE = "ml/jobs/retrain.lock"

def acquire_lock() -> bool:
    os.makedirs("ml/jobs", exist_ok=True)
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, "r") as f:
                content = f.read().strip()
                lock_data = json.loads(content) if content else {}
                lock_time = lock_data.get("time", 0)
                # If lock is older than 30 minutes, assume abandoned and override
                if time.time() - lock_time < 1800:
                    return False
        except Exception:
            return False

    with open(LOCK_FILE, "w") as f:
        json.dump({"pid": os.getpid(), "time": time.time()}, f)
    return True

def release_lock():
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
        except Exception:
            pass

def fetch_entries(app_url: str = "http://localhost:3000") -> List[Dict[str, Any]]:
    """
    Fetches archive entries from the Next.js API or local snapshot file.
    """
    # 1. Try local snapshot cache if available
    cache_file = "ml/snapshots/dataset_cache.json"
    
    # 2. Try fetching from web application API
    try:
        url = f"{app_url}/api/entries"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            entries = data.get("entries", [])
            if entries:
                os.makedirs("ml/snapshots", exist_ok=True)
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(entries, f)
                return entries
    except Exception as e:
        print(f"[Retrain] Could not reach {app_url}/api/entries: {e}")

    # 3. Fallback to cached dataset snapshot
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    return []

def run_retraining(
    entries: Optional[List[Dict[str, Any]]] = None,
    trigger: str = "MANUAL",
    force: bool = False,
    job_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes the automated retraining pipeline with strict concurrency control,
    data unchanged verification, candidate comparison, and conditional activation.
    """
    if not acquire_lock():
        return {
            "success": False,
            "status": "JOB_LOCKED",
            "message": "Another retraining job is currently in progress. Prevented duplicate overlapping run."
        }

    try:
        print(f"[Retrain] Starting retraining job triggered by {trigger} (force={force})...")
        if entries is None:
            entries = fetch_entries()

        verified_records, stats = filter_verified_records(entries)
        print(f"[Retrain] Evaluated {stats['total_evaluated']} records: {stats['verified_eligible']} eligible verified records.")

        summary = compute_dataset_summary(entries)

        if not summary["isSufficientForTraining"]:
            print(f"[Retrain] Data insufficient: {summary['minimumRequirementsMessage']}")
            return {
                "success": False,
                "status": "INSUFFICIENT_DATA",
                "message": summary["minimumRequirementsMessage"],
                "summary": summary
            }

        # Check if eligible verified data has changed since last model version
        last_count = 0
        pointer_file = os.path.join(MODELS_DIR, "active_version.txt")
        if os.path.exists(pointer_file) and not force:
            try:
                with open(pointer_file, "r") as f:
                    active_ver = f.read().strip()
                meta_path = os.path.join(MODELS_DIR, active_ver, "metadata.json")
                if os.path.exists(meta_path):
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                    last_count = meta.get("datasetSize", 0)
                    if len(verified_records) == last_count:
                        print("[Retrain] Dataset unchanged since last training run. Skipping retraining.")
                        return {
                            "success": True,
                            "status": "SKIPPED_UNCHANGED",
                            "message": f"Eligible verified records count ({len(verified_records)}) has not changed since model {active_ver}."
                        }
            except Exception as e:
                print(f"[Retrain] Error checking previous snapshot: {e}")

        new_records_count = max(0, len(verified_records) - last_count)
        candidate_version = f"v{int(time.time())}"

        # Train candidates and perform conditional promotion evaluation
        result = train_and_evaluate_candidates(
            verified_records,
            candidate_version=candidate_version,
            min_macro_f1=0.50
        )

        print(f"[Retrain] Finished run: {result.get('status')} - {result.get('promotion_reason')}")
        return result

    except Exception as e:
        print(f"[Retrain] Job failed with exception: {e}")
        return {
            "success": False,
            "status": "FAILED",
            "error": str(e)
        }
    finally:
        release_lock()

if __name__ == "__main__":
    force_run = "--force" in sys.argv
    run_retraining(trigger="CLI_MANUAL", force=force_run)
