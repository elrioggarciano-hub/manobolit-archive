"""Builds notebooks/ManoboLit_Genre_Classifier_Trainer.ipynb from the cell sources below.
Run: python -I scripts/evaluation/build_notebook.py              -> writes the notebook
     python -I -X utf8 scripts/evaluation/build_notebook.py --test DATA OUTDIR -> runs code cells locally (plots stubbed)
"""
import json, sys, os, types

CELLS = []
def md(s): CELLS.append(("markdown", s.strip("\n")))
def code(s): CELLS.append(("code", s.strip("\n")))

md(r"""
# 🌾 ManoboLit Archive — Genre Classifier Trainer

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/elrioggarciano-hub/manobolit-archive/blob/main/notebooks/ManoboLit_Genre_Classifier_Trainer.ipynb)

This notebook **trains the machine-learning component** of the ManoboLit Archive's **rule-based classifier**
(RIDDLE · PROVERB · FOLKTALE · SONG). The app scores each text with its rule base (Eugenio, 1993; Andress, 1985 — stored in
the database and extended with rule terms discovered from verified entries) and combines those rule scores 50/50 with the
probabilities of the model trained here, so the system keeps learning as more entries are verified.
In this pipeline:

1. **Data** — only *human-verified* archive entries are used, fetched live from the app's database (`/api/ml/dataset`).
2. **Training** — scikit-learn learns which character patterns distinguish each genre from the verified data.
3. **Evaluation** — Leave-One-Out Cross-Validation (every entry is tested by a model that never saw it), compared against a majority-class baseline.
4. **Export** — the learned vocabulary and weights are saved as a JSON model file.
5. **Deployment** — an admin uploads the model file (*Admin → ML Pipeline → Trained Model*). The app verifies it reproduces this notebook's predictions exactly, then uses it.

When more entries are verified, simply re-run this notebook and upload the new model.
""")

md(r"""
## ⚙️ 1. Configuration
Set `APP_URL` to the deployed ManoboLit Archive address. Use `DATA_SOURCE = "upload"` instead to upload a JSON export
(the response of `/api/ml/dataset`) from your computer.
""")
code(r"""
APP_URL = "https://YOUR-MANOBOLIT-APP.vercel.app"   # <- change to your deployed app URL
DATA_SOURCE = "url"            # "url" | "upload" | path to a local JSON file
LEXICON_SOURCE = "url"         # "url" (APP_URL/api/lexicon) | path to data/lexicon.json — used in section 10
UNCLASSIFIED_THRESHOLD = 0.35  # below this top probability the app answers UNCLASSIFIED (sent to human review)
MIN_EXAMPLES_PER_GENRE = 2     # genres with fewer verified examples cannot be learned or evaluated yet
RANDOM_SEED = 42
""")
code(r"""
import json, re, datetime
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt  # pyrefly: ignore[missing-import]  (preinstalled in Google Colab)
import sklearn
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import LeaveOneOut, cross_val_predict
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

np.random.seed(RANDOM_SEED)
print("scikit-learn", sklearn.__version__)
""")

md(r"""
## 📥 2. Load human-verified entries
The app only exports entries a reviewer has **verified** and whose text has not changed since verification.
""")
code(r"""
def load_payload():
    if DATA_SOURCE == "url":
        import requests
        r = requests.get(APP_URL.rstrip("/") + "/api/ml/dataset", timeout=60)
        r.raise_for_status()
        return r.json()
    if DATA_SOURCE == "upload":
        from google.colab import files  # pyrefly: ignore[missing-import]  (exists only inside Google Colab)
        uploaded = files.upload()
        return json.loads(next(iter(uploaded.values())).decode("utf-8"))
    with open(DATA_SOURCE, encoding="utf-8") as f:
        return json.load(f)

payload = load_payload()
rows = payload["dataset"] if isinstance(payload, dict) else payload
df = pd.DataFrame([{
    "id": r.get("id"),
    "title": r.get("title") or "",
    "transcription": r.get("transcription") or "",
    "translation": r.get("translation") or "",
    "genre": r.get("verifiedGenre") or r.get("genre"),
} for r in rows])

counts = df["genre"].value_counts()
too_few = counts[counts < MIN_EXAMPLES_PER_GENRE].index.tolist()
if too_few:
    print("⚠️ Skipping genres with too few verified examples:", too_few)
df = df[~df["genre"].isin(too_few)].reset_index(drop=True)
print(f"Verified entries used for training: {len(df)}")
df["genre"].value_counts()
""")
code(r"""
ax = df["genre"].value_counts().plot(kind="bar", color="#8F000D", title="Verified entries per genre")
ax.set_ylabel("entries"); plt.tight_layout(); plt.show()
""")

md(r"""
## 🧹 3. Preprocessing
Input text = **Manobo transcription + English translation** (titles and editorial descriptions are excluded).

To stop the model from "cheating", we *remove* editorial labels that give the answer away — genre names
(e.g. "riddle", "tigmo") and researcher citations — plus riddle answers ("Answer: …").
This is **not** a keyword list used for classification: these words are deleted from the text so the model must learn from the literature itself.
The exact same steps run inside the app (they are saved in the model file).
""")
code(r"""
TEXT_FIELDS = ["transcription", "translation"]
ANSWER_MARKERS = ["answer", "tubag"]
STRIP_TERMS = ["riddle", "riddles", "tigmo", "proverb", "proverbs", "panultihon", "folk song", "folk songs",
               "epic", "epics", "myth", "myths", "legend", "legends", "chant", "chants",
               "maravilla", "catipay", "curato"]

def _term(t):
    return re.escape(t).replace("\\ ", " ").replace(" ", r"\s*")

ANSWER_RE = re.compile(r"\b(?:" + "|".join(map(re.escape, ANSWER_MARKERS)) + r")\b\s*:[^\n\r]*", re.I)
STRIP_RE = re.compile(r"\b(?:" + "|".join(_term(t) for t in sorted(STRIP_TERMS, key=len, reverse=True)) + r")\b", re.I)
CLEAN_RE = re.compile(r"[^\w\s\-\']", re.UNICODE)
WS_RE = re.compile(r"\s+")

def preprocess(record):
    text = " ".join(str(record.get(f) or "") for f in TEXT_FIELDS if record.get(f))
    text = ANSWER_RE.sub(" ", text)
    text = STRIP_RE.sub(" ", text)
    text = text.lower().replace("\r", " ").replace("\n", " ")
    text = CLEAN_RE.sub(" ", text)
    return WS_RE.sub(" ", text).strip()

X = [preprocess(r) for r in df.to_dict("records")]
y = df["genre"].tolist()
print(X[0][:300], "...")
""")

md(r"""
## 🧠 4. Model
**Character n-gram TF-IDF (3–5 characters, within word boundaries) + Logistic Regression.**

* Character n-grams capture Manobo morphology (affixes such as *pig-, nig-, -on*, reduplication) and survive spelling variation between dialects and transcribers — important for a low-resource language with no standard orthography.
* Logistic Regression is a probabilistic, interpretable linear model: each learned weight says how strongly a character pattern points to a genre.
* Hyper-parameters are scikit-learn defaults (`C=1.0`) with balanced class weights; they are **not tuned on the evaluation data**, so the reported accuracy is not optimistic.
""")
code(r"""
def build_model():
    return Pipeline([
        ("features", FeatureUnion([
            ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)),
        ])),
        ("clf", LogisticRegression(C=1.0, class_weight="balanced", max_iter=5000)),
    ])
build_model()
""")

md(r"""
## 📊 5. Evaluation — Leave-One-Out Cross-Validation
For each entry: train on all *other* entries, then predict the held-out one. Every prediction is out-of-sample.
""")
code(r"""
loo = LeaveOneOut()
proba = cross_val_predict(build_model(), X, y, cv=loo, method="predict_proba")
classes = sorted(set(y))
pred = [classes[i] for i in proba.argmax(axis=1)]
top_p = proba.max(axis=1)

majority = pd.Series(y).value_counts()
acc = accuracy_score(y, pred)
f1 = f1_score(y, pred, average="macro")
covered = top_p >= UNCLASSIFIED_THRESHOLD
cov_acc = accuracy_score(np.array(y)[covered], np.array(pred)[covered]) if covered.any() else 0.0

print(f"Samples: {len(y)}   Majority baseline ({majority.index[0]}): {majority.iloc[0] / len(y):.1%}")
print(f"LOOCV accuracy: {acc:.1%}   macro-F1: {f1:.3f}")
print(f"With UNCLASSIFIED threshold {UNCLASSIFIED_THRESHOLD}: coverage {covered.mean():.1%}, accuracy on covered {cov_acc:.1%}")
print()
print(classification_report(y, pred, zero_division=0))
""")
code(r"""
cm = confusion_matrix(y, pred, labels=classes)
fig, ax = plt.subplots(figsize=(5, 4))
im = ax.imshow(cm, cmap="Reds")
ax.set_xticks(range(len(classes)), classes, rotation=45, ha="right"); ax.set_yticks(range(len(classes)), classes)
ax.set_xlabel("Predicted"); ax.set_ylabel("Actual (verified)"); ax.set_title("LOOCV confusion matrix")
for i in range(len(classes)):
    for j in range(len(classes)):
        ax.text(j, i, cm[i, j], ha="center", va="center", color="white" if cm[i, j] > cm.max() / 2 else "black")
plt.tight_layout(); plt.show()

errors = df.assign(predicted=pred, confidence=top_p.round(3))[np.array(pred) != np.array(y)]
errors[["title", "genre", "predicted", "confidence"]]
""")

md(r"""
### 5.0 Rule-based + machine learning — the system's decision
The app's final genre = 0.5 × rule score (its Eugenio rule base) + 0.5 × this model's probability. The rule scores of each
verified entry come with the dataset export, so the combination can be evaluated here with the same leave-one-out protocol.
The weight 0.5 is fixed beforehand (not tuned on these results).
""")
code(r"""
RULE_WEIGHT = 0.5
records_for_rules = df.to_dict("records")
rule_rows = [r for r in rows if (r.get("verifiedGenre") or r.get("genre")) in set(y)]
if all(isinstance(r.get("ruleScores"), dict) for r in rule_rows) and len(rule_rows) == len(y):
    R = np.array([[r["ruleScores"].get(c, 0.0) for c in classes] for r in rule_rows])
    blend = RULE_WEIGHT * R + (1 - RULE_WEIGHT) * proba
    rule_pred = [classes[i] for i in R.argmax(axis=1)]
    blend_pred = [classes[i] for i in blend.argmax(axis=1)]
    blend_top = blend.max(axis=1)
    answered = blend_top >= UNCLASSIFIED_THRESHOLD
    combo = pd.DataFrame([
        {"method": "Rules only (Eugenio rule base)", "accuracy": round(accuracy_score(y, rule_pred), 3), "macro-F1": round(f1_score(y, rule_pred, average="macro"), 3)},
        {"method": "Machine learning only (this model)", "accuracy": round(acc, 3), "macro-F1": round(f1, 3)},
        {"method": "Rule-based + ML (system decision)", "accuracy": round(accuracy_score(y, blend_pred), 3), "macro-F1": round(f1_score(y, blend_pred, average="macro"), 3)},
    ])
    print(f"With the {UNCLASSIFIED_THRESHOLD} threshold the combined system answers {answered.mean():.0%} of entries, "
          f"accuracy on those {accuracy_score(np.array(y)[answered], np.array(blend_pred)[answered]) if answered.any() else 0:.0%}; "
          "the rest are sent to human review.")
else:
    combo = None
    print("The dataset export has no rule scores (older app version) - skipping the combined evaluation.")
combo
""")

md(r"""
### 5.1 Alternative feature sets (for comparison)
Same LOOCV protocol. Shown for transparency; the model above was chosen for the linguistic reasons in section 4.
""")
code(r"""
TOKEN_PATTERN = r"(?u)\b[\w'-]+\b"
alternatives = {
    "Char 3-5 + LogReg (chosen)": build_model,
    "Words 1-2 + LogReg": lambda: Pipeline([("w", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, token_pattern=TOKEN_PATTERN)),
                                            ("clf", LogisticRegression(class_weight="balanced", max_iter=5000))]),
    "Words + Char + LogReg": lambda: Pipeline([("f", FeatureUnion([
                                                  ("w", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, token_pattern=TOKEN_PATTERN)),
                                                  ("c", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True))])),
                                               ("clf", LogisticRegression(class_weight="balanced", max_iter=5000))]),
    "Char 3-5 + Naive Bayes": lambda: Pipeline([("c", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)),
                                                ("clf", MultinomialNB())]),
}
results = []
for name, make in alternatives.items():
    p = cross_val_predict(make(), X, y, cv=loo)
    results.append({"model": name, "LOOCV accuracy": round(accuracy_score(y, p), 3), "macro-F1": round(f1_score(y, p, average="macro"), 3)})
results.append({"model": "Majority-class baseline", "LOOCV accuracy": round(majority.iloc[0] / len(y), 3), "macro-F1": None})
pd.DataFrame(results)
""")

md(r"""
## 📈 6. Learning curve — does it improve with more verified data?
Random training subsets of increasing size (repeated 30×), tested on the remaining entries.
An upward curve is the evidence that verifying more entries makes the classifier smarter.
""")
code(r"""
rng = np.random.default_rng(RANDOM_SEED)
X_arr, y_arr = np.array(X, dtype=object), np.array(y)
n_classes = len(classes)
sizes = list(range(max(n_classes, 4), len(y) - 1, max(1, len(y) // 10)))
curve = []
for size in sizes:
    scores = []
    for _ in range(30):
        idx = rng.permutation(len(y))
        train, test = idx[:size], idx[size:]
        if len(set(y_arr[train])) < 2:
            continue
        m = build_model().fit(list(X_arr[train]), list(y_arr[train]))
        scores.append(accuracy_score(y_arr[test], m.predict(list(X_arr[test]))))
    curve.append((size, np.mean(scores), np.std(scores)))
sz, mean, std = zip(*curve)
plt.figure(figsize=(6, 3.5))
plt.plot(sz, mean, marker="o", color="#8F000D", label="trained model")
plt.fill_between(sz, np.array(mean) - std, np.array(mean) + std, color="#8F000D", alpha=0.15)
plt.axhline(majority.iloc[0] / len(y), ls="--", color="gray", label="majority baseline")
plt.xlabel("verified training entries"); plt.ylabel("accuracy on unseen entries"); plt.title("Learning curve")
plt.legend(); plt.tight_layout(); plt.show()
""")

md(r"""
## 🏷️ 6b. Themes — learned from verified entries (multi-label)
Each entry can have several themes (Andress, 1985). With few examples per theme, a **k-nearest-neighbour memory**
works best: a new text receives the themes of the most similar *verified* entries, weighted by similarity.
The app combines this k-NN memory with its Andress (1985) theme rules (a theme is assigned if the rules or the
nearest verified entries indicate it), so it improves automatically as more entries are verified. Compared below (leave-one-out, micro-averaged) with a one-vs-rest Logistic Regression and a
"most frequent theme" baseline.
""")
code(r"""
from sklearn.metrics.pairwise import cosine_similarity

THEME_K, THEME_THRESHOLD = 3, 0.34
theme_sets = [set(r.get("verifiedThemes") or []) for r in rows if (r.get("verifiedGenre") or r.get("genre")) in set(y)]
all_themes = sorted({t for s in theme_sets for t in s})
print(f"{len(all_themes)} themes used; examples per theme:", {t: sum(t in s for s in theme_sets) for t in all_themes})

def micro(preds, golds):
    tp = sum(len(p & g) for p, g in zip(preds, golds)); fp = sum(len(p - g) for p, g in zip(preds, golds))
    fn = sum(len(g - p) for p, g in zip(preds, golds))
    P = tp / (tp + fp) if tp + fp else 0.0; R = tp / (tp + fn) if tp + fn else 0.0
    return round(P, 3), round(R, 3), round(2 * P * R / (P + R), 3) if P + R else 0.0

theme_preds = {"k-NN memory (combined with theme rules in the app)": [], "One-vs-rest LogReg": [], "Most frequent theme": []}
for i in range(len(X)):
    tr = [j for j in range(len(X)) if j != i]
    vec = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True).fit([X[j] for j in tr])
    Xtr, xi = vec.transform([X[j] for j in tr]), vec.transform([X[i]])
    sims = cosine_similarity(xi, Xtr)[0]
    order = [k for k in np.argsort(sims)[::-1] if theme_sets[tr[k]]][:THEME_K]
    total = sum(sims[k] for k in order) or 1.0
    votes = {}
    for k in order:
        for t in theme_sets[tr[k]]:
            votes[t] = votes.get(t, 0) + sims[k]
    theme_preds["k-NN memory (combined with theme rules in the app)"].append({t for t, v in votes.items() if v / total >= THEME_THRESHOLD})
    lr_pred = set()
    for t in all_themes:
        yt = [t in theme_sets[j] for j in tr]
        if 0 < sum(yt) < len(yt):
            m = LogisticRegression(class_weight="balanced", max_iter=3000).fit(Xtr, yt)
            if m.predict_proba(xi)[0, 1] >= 0.5:
                lr_pred.add(t)
    theme_preds["One-vs-rest LogReg"].append(lr_pred)
    counts_tr = {t: sum(t in theme_sets[j] for j in tr) for t in all_themes}
    theme_preds["Most frequent theme"].append({max(counts_tr, key=counts_tr.get)} if counts_tr else set())

theme_results = pd.DataFrame([{"method": k, **dict(zip(["micro-P", "micro-R", "micro-F1"], micro(v, theme_sets)))}
                              for k, v in theme_preds.items()])
theme_results
""")

md(r"""
## 🏁 7. Train the final model on all verified entries
""")
code(r"""
final_model = build_model().fit(X, y)
clf = final_model.named_steps["clf"]
vectorizers = [(name, vec) for name, vec in final_model.named_steps["features"].transformer_list]
feature_names = np.concatenate([vec.get_feature_names_out() for _, vec in vectorizers])

top_features = {}
for k, genre in enumerate(clf.classes_):
    row = clf.coef_[k] if len(clf.classes_) > 2 else (clf.coef_[0] if k == 1 else -clf.coef_[0])
    best = np.argsort(row)[::-1][:15]
    top_features[genre] = [{"feature": feature_names[i], "weight": round(float(row[i]), 4)} for i in best]
pd.DataFrame({g: [f["feature"] for f in feats] for g, feats in top_features.items()})
""")
md(r"""
The table shows the character patterns the model **learned** as most indicative of each genre (a space marks a word boundary).
""")

md(r"""
## 📦 8. Export the model file
The file contains the learned vocabulary, IDF weights, coefficients, the evaluation results, and **parity tests**:
sample inputs with this notebook's predicted probabilities. On upload the app re-computes them and rejects the file if they differ.
""")
code(r"""
def sig(x, digits=9):
    return float(f"{float(x):.{digits}g}")

def export_vectorizer(name, vec):
    terms = vec.get_feature_names_out().tolist()
    return {
        "name": name,
        "analyzer": vec.analyzer,
        "ngramRange": list(vec.ngram_range),
        "sublinearTf": bool(vec.sublinear_tf),
        "tokenPattern": vec.token_pattern if vec.analyzer == "word" else None,
        "terms": terms,
        "idf": [sig(v) for v in vec.idf_],
    }

records = df.to_dict("records")
probe_inputs = [{f: r[f] for f in TEXT_FIELDS} for r in records[: min(8, len(records))]]
probe_inputs += [{"transcription": "Unsa kini? Tu maintok pad, pag aslag un", "translation": ""},
                 {"transcription": "", "translation": "Once upon a time a monkey and a crocodile lived by the river."},
                 {"transcription": "Da'an og-ilaan — ÑAÑA kan bata!! -- 'kuna' 2024\nTigmo: unsa? Answer: lubi", "translation": "A riddle (Maravilla 2024)."}]
probe_proba = final_model.predict_proba([preprocess(p) for p in probe_inputs])

now = datetime.datetime.now(datetime.timezone.utc)
version = "colab-" + now.strftime("%Y%m%d-%H%M%S")
artifact = {
    "format": "manobolit-sklearn-linear-v1",
    "version": version,
    "createdAt": now.isoformat(),
    "algorithm": "Character n-gram TF-IDF (3-5, char_wb) + Logistic Regression",
    "sklearnVersion": sklearn.__version__,
    "classes": clf.classes_.tolist(),
    "preprocessing": {"fields": TEXT_FIELDS, "answerMarkers": ANSWER_MARKERS, "stripTerms": STRIP_TERMS},
    "vectorizers": [export_vectorizer(n, v) for n, v in vectorizers],
    "coef": [[sig(v) for v in row] for row in clf.coef_],
    "intercept": [sig(v) for v in clf.intercept_],
    "unclassifiedThreshold": UNCLASSIFIED_THRESHOLD,
    "trainedSamples": len(y),
    "classCounts": {k: int(v) for k, v in pd.Series(y).value_counts().items()},
    "metrics": {
        "evaluation": "LOOCV",
        "accuracy": round(acc, 4), "macroF1": round(f1, 4),
        "majorityBaseline": round(majority.iloc[0] / len(y), 4),
        "coverageAtThreshold": round(float(covered.mean()), 4), "accuracyOnCovered": round(float(cov_acc), 4),
        "perClass": classification_report(y, pred, output_dict=True, zero_division=0),
        "confusionMatrix": {"labels": classes, "matrix": cm.tolist()},
        "learningCurve": [{"trainSize": int(s), "accuracy": round(float(m), 4)} for s, m, _ in curve],
    },
    "topFeatures": top_features,
    "parityTests": [{"input": p, "probabilities": [float(v) for v in row]} for p, row in zip(probe_inputs, probe_proba)],
}
MODEL_FILE = f"manobolit-genre-model-{version}.json"
with open(MODEL_FILE, "w", encoding="utf-8") as f:
    json.dump(artifact, f, ensure_ascii=False)
print(f"Saved {MODEL_FILE} ({len(feature_names)} learned features, LOOCV accuracy {acc:.1%})")
""")
code(r"""
# Download the model file, then upload it in the app: Admin → ML Pipeline → Trained Model (Colab).
try:
    from google.colab import files  # pyrefly: ignore[missing-import]  (exists only inside Google Colab)
    files.download(MODEL_FILE)
except ImportError:
    print("Not running in Colab; the file is saved next to this notebook:", MODEL_FILE)
""")

md(r"""
## 🚀 9. (Optional) Upload directly to the app
Instead of downloading, you can upload straight from Colab. You will be asked for the admin password (it is not stored).
""")
code(r"""
UPLOAD_TO_APP = False   # set to True to upload directly

if UPLOAD_TO_APP:
    import requests, getpass
    session = requests.Session()
    login = session.post(APP_URL.rstrip("/") + "/api/auth/login", json={"password": getpass.getpass("Admin password: ")}, timeout=30)
    login.raise_for_status()
    res = session.post(APP_URL.rstrip("/") + "/api/ml/models/trained", json=artifact, timeout=120)
    print(res.status_code, res.json())
""")

md(r"""
## 🔤 10. Translation — learning word translations from the literature (IBM Model 1)
The translator does not rely only on a typed dictionary: it **learns** which Manobo word corresponds to which
Bisaya/English word from the verified parallel texts, using IBM Model 1 statistical word alignment (Brown et al., 1993),
trained with Expectation-Maximization. The app runs this same algorithm on its database and retrains automatically.

**Held-out test:** hide one third of the dictionary words that occur in the literature, train on the texts + the rest
of the dictionary, and check whether the model rediscovers the hidden translations. Repeated for all three folds.
""")
code(r"""
from collections import defaultdict

def load_lexicon():
    if LEXICON_SOURCE == "url":
        import requests
        return requests.get(APP_URL.rstrip("/") + "/api/lexicon", timeout=60).json()
    with open(LEXICON_SOURCE, encoding="utf-8") as f:
        raw = json.load(f)
    entries = raw["entries"]
    return {"words": [e for e in entries if e["kind"] == "WORD"], "webonary": [e for e in entries if e["kind"] == "WEBONARY"]}

lexicon = load_lexicon()
TOK = re.compile(r"[^\W\d_]+(?:['-][^\W\d_]+)*")
toks = lambda s: TOK.findall((s or "").lower())
single = lambda s: (lambda f: f if f and " " not in f else None)((s or "").lower().split(" / ")[0].split(" (")[0].strip())

def ibm1(pairs, iterations=15):
    t = defaultdict(lambda: 1e-3)
    for _ in range(iterations):
        count, total = defaultdict(float), defaultdict(float)
        for src, tgt in pairs:
            for e in tgt:
                z = sum(t[(f, e)] for f in src) or 1e-12
                for f in src:
                    c = t[(f, e)] / z; count[(f, e)] += c; total[f] += c
        t = defaultdict(lambda: 1e-6, {k: v / total[k[0]] for k, v in count.items()})
    best = {}
    for (f, e), p in t.items():
        if p > best.get(f, ("", 0))[1]:
            best[f] = (e, p)
    return best

align_results = []
for lang, text_field, lex_field in [("Bisaya", "bisayaTranslation", "bisaya"), ("English", "translation", "english")]:
    docs = []
    for r in rows:
        a, b = toks(r.get("transcription")), toks(r.get(text_field))
        if a and b and 1 / 3 <= len(a) / len(b) <= 3:
            docs.append((a, b))
    seen = {w for a, _ in docs for w in a}
    seeds = [(single(e["manobo"]), single(e.get(lex_field))) for e in lexicon["words"] + lexicon["webonary"]]
    seeds = [(m, t) for m, t in seeds if m and t]
    gold = dict((m, t) for m, t in seeds if m in seen)
    words = list(gold.items())
    for tau in (0.3, 0.5):
        n = correct = 0
        for fold in range(3):
            held = [w for i, w in enumerate(words) if i % 3 == fold]
            hidden = {m for m, _ in held}
            best = ibm1(docs + [([m], [t]) for m, t in seeds if m not in hidden])
            for m, t in held:
                if m in best and best[m][1] >= tau:
                    n += 1; correct += best[m][0] == t
        align_results.append({"Manobo →": lang, "min. probability": tau, "learned pairs": n,
                              "correct": correct, "precision": round(correct / n, 2) if n else None})
pd.DataFrame(align_results)
""")
md(r"""
In the app, learned **Manobo ↔ Bisaya** pairs with probability ≥ 0.5 are used for words missing from the lexicon and
are labelled *"Learned from archive (unverified)"*. English pairs are not reliable enough yet, so they are only shown to
reviewers (*Admin → Lexicon → Words the system learned*), who approve correct ones into the lexicon.
""")

md(r"""
---
### How the app uses this model
* The web app stores the uploaded model in the database (`MLModelRegistry`) and uses it, together with the rule base, for every genre prediction.
* The app's source code contains **no vocabulary or weights** — only the generic math to apply a scikit-learn model.
* The app's decision is **rule-based + machine learning**: its Eugenio (1993) / Andress (1985) rule base (stored in the database, grown with reviewer-approved rule terms discovered from verified entries) is combined 50/50 with this model's probabilities.
""")


def build(path):
    nb = {"cells": [], "metadata": {"colab": {"provenance": []},
                                     "kernelspec": {"display_name": "Python 3", "name": "python3"},
                                     "language_info": {"name": "python"}},
          "nbformat": 4, "nbformat_minor": 0}
    for kind, src in CELLS:
        lines = [l + "\n" for l in src.split("\n")]
        lines[-1] = lines[-1].rstrip("\n")
        cell = {"cell_type": kind, "metadata": {}, "source": lines}
        if kind == "code":
            cell.update({"execution_count": None, "outputs": []})
        nb["cells"].append(cell)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(nb, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("wrote", path, len(CELLS), "cells")


def test(data_path, out_dir):
    # Stub matplotlib so cells run where it is not installed.
    class _Any:
        def __getattr__(self, _): return _Any()
        def __call__(self, *a, **k): return _Any()
        def __iter__(self): return iter([_Any(), _Any()])
        def __gt__(self, o): return False
    plt_mod = types.ModuleType("matplotlib.pyplot")
    plt_mod.__getattr__ = lambda name: _Any()
    plt_mod.subplots = lambda *a, **k: (_Any(), _Any())
    mpl = types.ModuleType("matplotlib"); mpl.pyplot = plt_mod
    sys.modules["matplotlib"] = mpl; sys.modules["matplotlib.pyplot"] = plt_mod
    try:
        import pandas  # noqa
    except ImportError:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import pd_shim
        sys.modules["pandas"] = pd_shim
    g = {"__name__": "__main__"}
    os.chdir(out_dir)
    for kind, src in CELLS:
        if kind != "code" or ".plot(kind" in src:
            continue
        src = src.replace('DATA_SOURCE = "url"', f'DATA_SOURCE = {data_path!r}')
        src = src.replace('LEXICON_SOURCE = "url"', 'LEXICON_SOURCE = ' + repr(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "lexicon.json")))
        exec(compile(src, "<cell>", "exec"), g)
    print("ALL CELLS OK ->", g["MODEL_FILE"])
    print(g["pd"].DataFrame(g["results"]).to_string())
    print(g["combo"].to_string() if g.get("combo") is not None else "no combo")
    print(g["theme_results"].to_string())
    print(g["pd"].DataFrame(g["align_results"]).to_string())


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--test":
        test(os.path.abspath(sys.argv[2]), os.path.abspath(sys.argv[3] if len(sys.argv) > 3 else "."))
    else:
        build(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "notebooks", "ManoboLit_Genre_Classifier_Trainer.ipynb"))
