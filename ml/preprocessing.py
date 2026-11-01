import re
import hashlib
from typing import Dict, Any, Optional

# Manobo orthography patterns: preserve hyphens (og-ilaan, pag-usab), apostrophes for glottal stops (da'an),
# and lowercase characters without stripping language-specific grammatical markers.
CLEAN_REGEX = re.compile(r"[^\w\s\-\']", re.UNICODE)
WHITESPACE_REGEX = re.compile(r"\s+")

def clean_text(text: Optional[str]) -> str:
    """
    Cleans and normalizes text for machine learning.
    Preserves:
      - Glottal stops (e.g. da'an)
      - Compound affixes with hyphens (e.g. og-ilaan, ka-an, kaba-kaba)
      - Multilingual tokens (Manobo, Bisaya, English)
    Does NOT aggressively stem or apply English-only stopword lists,
    as short grammatical words (te, ne, su, to, og, kan) are vital Manobo markers.
    """
    if not text:
        return ""
    # Normalize unicode whitespace
    text = text.strip()
    text = text.lower()
    # Replace newlines/tabs with space
    text = text.replace("\r", " ").replace("\n", " ")
    # Keep word characters, spaces, hyphens, and apostrophes
    text = CLEAN_REGEX.sub(" ", text)
    # Collapse multiple spaces
    text = WHITESPACE_REGEX.sub(" ", text)
    return text.strip()

def combine_entry_fields(entry: Dict[str, Any]) -> str:
    """
    Combines authentic classification-relevant text representations.
    Excludes answer-revealing labels, reviewer notes, and metadata IDs.
    """
    parts = [
        entry.get("title") or "",
        entry.get("manoboTitle") or "",
        entry.get("englishTitle") or "",
        entry.get("transcription") or "",  # Authentic Agusan Manobo dialect text
        entry.get("translation") or "",    # English field translation
        entry.get("content") or "",        # Contextual literary description
    ]
    raw_combined = " ".join(p for p in parts if p)
    return clean_text(raw_combined)

def compute_content_hash(entry: Dict[str, Any]) -> str:
    """
    Deterministic SHA-256 hash matching the frontend/backend TypeScript implementation
    in lib/classification/contentHash.ts.
    Used to detect any edits made to classification-relevant text after human verification.
    """
    parts = [
        (entry.get("title") or "").strip().lower(),
        (entry.get("transcription") or "").strip().lower(),
        (entry.get("translation") or "").strip().lower(),
        (entry.get("content") or "").strip().lower(),
    ]
    canonical_repr = "\n---\n".join(parts)
    return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()
