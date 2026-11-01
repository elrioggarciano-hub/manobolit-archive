from typing import Dict, Any, List, Tuple
from ml.preprocessing import clean_text

GENRE_RULES = [
    {
        "genre": "MYTH",
        "keywords": [
            "creation", "origin", "beginning", "first", "god", "gods", "deity", "deities",
            "universe", "world", "sky", "earth", "primordial", "chaos", "divine", "spirit",
            "supernatural", "formed", "made the world", "great spirit", "creator",
            "myth", "stars", "birth", "breath", "darkness", "ancient times", "father sky",
            "origin myth", "celestial", "shaman", "ancestral", "cosmos"
        ],
        "phrases": [
            "in the beginning", "when the world was", "the first people", "long before time",
            "before humans existed", "the great spirit", "at the dawn of", "how the world came to be",
            "origin of", "the beginning of all things", "born from the breath", "give birth to",
            "father sky", "sky father", "ancient times"
        ],
        "baseConfidence": 0.92
    },
    {
        "genre": "LEGEND",
        "keywords": [
            "hero", "supernatural", "mountain", "lake", "river", "historical", "ancient",
            "landmark", "sacred", "place", "origin of place", "guardian", "spirit", "blessed"
        ],
        "phrases": [
            "it is said that", "according to legend", "the story goes", "they say that",
            "long ago there was", "it is believed", "legend has it", "the legend of",
            "it came to be known", "to this day"
        ],
        "baseConfidence": 0.88
    },
    {
        "genre": "FOLKTALE",
        "keywords": [
            "animal", "trickster", "moral", "lesson", "clever", "foolish", "monkey", "crocodile",
            "bird", "fish", "deer", "turtle", "rabbit", "outwit", "trick", "deceive", "cunning",
            "fairy", "diwata", "goddess", "river goddess", "native", "stream", "enchanted",
            "tagbanwa", "sigulanon", "sugilanon", "tala", "yumad", "bata", "sapa", "wuhig"
        ],
        "phrases": [
            "once upon a time", "long ago in a village", "there lived a", "in a faraway place",
            "and so it is said", "let this be a lesson", "the moral of this story",
            "and they lived", "a long time ago", "one day", "in a village", "there was a",
            "the fairy of", "the fish in the stream", "the mountain native", "mountain native"
        ],
        "baseConfidence": 0.90
    },
    {
        "genre": "EPIC",
        "keywords": [
            "warrior", "battle", "journey", "quest", "conquest", "hero", "brave", "courageous",
            "sword", "spear", "enemy", "victory", "defeat", "kingdom", "tribe", "champion",
            "invader", "protect", "defender", "mighty", "chieftain", "fight", "defend",
            "warrior tribe", "epic", "ulaging", "agyu"
        ],
        "phrases": [
            "the great warrior", "embarked on a journey", "set out to battle",
            "fought valiantly", "to protect his people", "faced many dangers",
            "his deeds are remembered", "across many lands"
        ],
        "baseConfidence": 0.90
    },
    {
        "genre": "RIDDLE",
        "keywords": [
            "riddle", "what am i", "guess", "puzzle", "question", "solve",
            "mystery", "brain teaser", "what is it", "tigmo",
            "batong", "uling", "tubo", "lubi", "kahayag", "damgo", "anino", "tabako",
            "kaba-kaba", "bitok", "rembo", "atabay", "pusilon", "pultahan", "bitoy"
        ],
        "phrases": [
            "what has", "i have no", "i am always", "you can see me but",
            "what goes up and never", "what walks on",
            "tu maintok pad", "angud to", "pag aslag", "kunag ka", "kunag baja",
            "likat diyat", "inggad pusilon", "buhi gihapon", "answer:", "the answer is",
            "planted tobacco", "stages of coal"
        ],
        "baseConfidence": 0.92
    },
    {
        "genre": "PROVERB",
        "keywords": [
            "proverb", "saying", "adage", "wisdom", "old saying", "they say", "it is wise",
            "one must", "never", "always remember", "the wise say",
            "panultihon", "integrity", "temptation", "trust", "virtue", "principled",
            "moral", "lesson", "inner beauty", "character", "behavior", "attitude",
            "happiness", "principled living", "self-respect"
        ],
        "phrases": [
            "as the elders say", "it is said by the wise", "remember always",
            "as the saying goes", "a man who", "no matter how hard", "it is better to",
            "it is said", "it emphasizes", "this proverb", "the proverb", "panultihon"
        ],
        "baseConfidence": 0.91
    },
    {
        "genre": "SONG",
        "keywords": [
            "sing", "song", "melody", "rhythm", "chorus", "verse", "dance", "music",
            "chant", "tune", "lyric", "refrain", "we sing", "let us sing",
            "folk song", "manobo folk song", "tribe", "tribal", "longing", "sorrow",
            "loneliness", "lament", "voice", "heart", "tears", "weep",
            "kadikiluman", "panaw", "sinugow", "kapait", "nilugdang", "kabubunganan"
        ],
        "phrases": [
            "the song captures", "the song conveys", "the song portrays", "the song talks",
            "the song explores", "the song sends", "folk song", "manobo folk song",
            "we sing together", "sing this song", "the mountains are bare",
            "hardship of my situation", "maravilla (2024)", "maravilla, 2024"
        ],
        "baseConfidence": 0.91
    },
    {
        "genre": "CHANT",
        "keywords": [
            "chant", "ritual", "ceremony", "invoke", "call upon", "ancestors", "spirits",
            "sacred words", "incantation", "prayer", "blessing", "invocation"
        ],
        "phrases": [
            "we call upon", "hear our voices", "come to us", "bless this place",
            "ancient words", "sacred chant", "ritual words"
        ],
        "baseConfidence": 0.88
    }
]

def classify_with_rules(text: str) -> Dict[str, Any]:
    """
    Evaluates text against the domain expert rule system (Eugenio 1993).
    Returns the top scored genre, confidence, matched rules/keywords, and all genre scores.
    """
    normalized = clean_text(text)
    scores: Dict[str, float] = {}
    matches: Dict[str, List[str]] = {}

    for rule in GENRE_RULES:
        genre = rule["genre"]
        score = 0.0
        genre_matches = []

        for phrase in rule["phrases"]:
            if phrase.lower() in normalized:
                score += 3.0
                genre_matches.append(f"phrase: {phrase}")

        for keyword in rule["keywords"]:
            # Token boundary or substring match
            if keyword.lower() in normalized:
                score += 1.0
                genre_matches.append(f"keyword: {keyword}")

        if score > 0:
            scores[genre] = score
            matches[genre] = genre_matches

    if not scores:
        return {
            "predicted_genre": "FOLKTALE",  # Neutral baseline if unclassified
            "confidence": 0.30,
            "prediction_source": "RULE_BASED",
            "is_uncertain": True,
            "rules_applied": [],
            "scores": {r["genre"]: 0.0 for r in GENRE_RULES}
        }

    top_genre = max(scores.items(), key=lambda x: x[1])[0]
    total_score = sum(scores.values())
    raw_conf = min(0.95, (scores[top_genre] / total_score) * 0.85 + 0.10)

    # Normalize scores as probabilities
    all_scores = {g: round(scores.get(g, 0.0) / total_score, 4) for g in [r["genre"] for r in GENRE_RULES]}

    return {
        "predicted_genre": top_genre,
        "confidence": round(raw_conf, 4),
        "prediction_source": "RULE_BASED",
        "is_uncertain": raw_conf < 0.50,
        "rules_applied": matches.get(top_genre, []),
        "scores": all_scores
    }
