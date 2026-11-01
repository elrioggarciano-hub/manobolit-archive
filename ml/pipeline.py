from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import MultinomialNB
from typing import Dict, Any

RANDOM_SEED = 42

def create_feature_extractor() -> FeatureUnion:
    """
    Constructs a hybrid word and character n-gram TF-IDF feature extractor.
    - Word n-grams (1, 2): captures lexical keywords and collocations without English stopword removal.
    - Character n-grams (3, 5): captures Manobo morphological variations, affixes, and orthographic patterns.
    """
    word_vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        token_pattern=r"(?u)\b[\w\'-]+\b"
    )
    char_vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        sublinear_tf=True,
        min_df=1
    )
    return FeatureUnion([
        ("word_tfidf", word_vectorizer),
        ("char_tfidf", char_vectorizer),
    ])

def build_candidate_pipelines() -> Dict[str, Pipeline]:
    """
    Builds the candidate scikit-learn classification pipelines for model comparison.
    Every pipeline encapsulates the full preprocessing + feature extraction + classifier
    to guarantee 100% consistency between training and inference.
    """
    pipelines = {
        "LogisticRegression": Pipeline([
            ("features", create_feature_extractor()),
            ("clf", LogisticRegression(
                C=1.0,
                class_weight="balanced",
                max_iter=1000,
                random_state=RANDOM_SEED,
                solver="lbfgs"
            ))
        ]),
        "LinearSVC_Calibrated": Pipeline([
            ("features", create_feature_extractor()),
            ("clf", CalibratedClassifierCV(
                estimator=LinearSVC(
                    C=1.0,
                    class_weight="balanced",
                    random_state=RANDOM_SEED,
                    dual="auto"
                ),
                method="sigmoid",
                cv=2  # Calibrated for small datasets
            ))
        ]),
        "MultinomialNB": Pipeline([
            ("features", create_feature_extractor()),
            ("clf", MultinomialNB(alpha=1.0))
        ])
    }
    return pipelines
