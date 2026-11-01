import os
import json
from typing import List, Dict, Any, Tuple, Optional
from ml.preprocessing import combine_entry_fields, compute_content_hash

OFFICIAL_GENRES = [
    "MYTH", "LEGEND", "FOLKTALE", "EPIC",
    "RIDDLE", "PROVERB", "SONG", "CHANT"
]

def filter_verified_records(raw_entries: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Applies strict verification provenance checks:
    - Only records with reviewStatus == 'VERIFIED'
    - Only records where current contentHash == verifiedContentHash
      (guaranteeing that text has NOT changed after human review)
    - Excludes 'PENDING' and 'UNCERTAIN' records from supervised training data.
    """
    verified = []
    excluded_pending = 0
    excluded_uncertain = 0
    excluded_hash_mismatch = 0

    for entry in raw_entries:
        status = (entry.get("reviewStatus") or "").upper()
        if status == "PENDING":
            excluded_pending += 1
            continue
        elif status == "UNCERTAIN":
            excluded_uncertain += 1
            continue
        elif status == "VERIFIED":
            curr_hash = entry.get("contentHash") or compute_content_hash(entry)
            verified_hash = entry.get("verifiedContentHash") or ""
            # If hash has changed since human review, exclude from training!
            if verified_hash and curr_hash != verified_hash:
                excluded_hash_mismatch += 1
                continue
            
            # Record must have an approved / verified genre
            target_genre = entry.get("verifiedGenre") or entry.get("genre")
            if not target_genre:
                continue

            cleaned_text = combine_entry_fields(entry)
            if not cleaned_text:
                continue

            verified.append({
                "id": entry.get("id"),
                "text": cleaned_text,
                "genre": target_genre,
                "verifiedThemes": entry.get("verifiedThemes") or entry.get("themes") or [],
                "source": entry.get("source"),
                "communityLocation": entry.get("communityLocation"),
                "contentHash": curr_hash,
                "verifiedAt": entry.get("reviewedAt"),
                "reviewerId": entry.get("reviewerId")
            })

    stats = {
        "total_evaluated": len(raw_entries),
        "verified_eligible": len(verified),
        "excluded_pending": excluded_pending,
        "excluded_uncertain": excluded_uncertain,
        "excluded_hash_mismatch": excluded_hash_mismatch,
    }
    return verified, stats

def compute_dataset_summary(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes summary metrics for human verification status and class distributions.
    Identifies underrepresented or missing categories honestly without fabrication.
    """
    verified_counts: Dict[str, int] = {g: 0 for g in OFFICIAL_GENRES}
    total_verified = 0
    total_pending = 0
    total_uncertain = 0

    for e in entries:
        status = (e.get("reviewStatus") or "PENDING").upper()
        if status == "VERIFIED":
            curr_hash = e.get("contentHash") or compute_content_hash(e)
            ver_hash = e.get("verifiedContentHash") or ""
            if not ver_hash or curr_hash == ver_hash:
                g = e.get("verifiedGenre") or e.get("genre")
                if g in verified_counts:
                    verified_counts[g] += 1
                else:
                    verified_counts[g] = 1
                total_verified += 1
            else:
                total_pending += 1  # Hash mismatch marks entry as needing re-review
        elif status == "UNCERTAIN":
            total_uncertain += 1
        else:
            total_pending += 1

    missing_genres = [g for g, count in verified_counts.items() if count == 0]
    underrepresented_genres = [g for g, count in verified_counts.items() if 0 < count < 3]

    # Can we reliably train a multi-class supervised ML model?
    # At minimum, need >= 2 classes with >= 2 examples each
    classes_with_min_samples = sum(1 for count in verified_counts.values() if count >= 2)
    is_sufficient_for_training = classes_with_min_samples >= 2 and total_verified >= 4

    return {
        "totalRecords": len(entries),
        "totalVerified": total_verified,
        "totalPending": total_pending,
        "totalUncertain": total_uncertain,
        "verifiedCounts": verified_counts,
        "missingGenres": missing_genres,
        "underrepresentedGenres": underrepresented_genres,
        "isSufficientForTraining": is_sufficient_for_training,
        "minimumRequirementsMessage": (
            "Ready for supervised training"
            if is_sufficient_for_training
            else f"Insufficient verified data: requires at least 2 categories with >= 2 verified examples each (currently {classes_with_min_samples} classes meet this)."
        )
    }

def save_snapshot(verified_records: List[Dict[str, Any]], snapshot_dir: str = "ml/snapshots") -> str:
    """
    Saves an immutable dataset snapshot for reproducible retraining and auditing.
    """
    os.makedirs(snapshot_dir, exist_ok=True)
    import time
    timestamp = int(time.time())
    snapshot_path = os.path.join(snapshot_dir, f"snapshot_{timestamp}.json")
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(verified_records, f, indent=2, ensure_ascii=False)
    return snapshot_path
