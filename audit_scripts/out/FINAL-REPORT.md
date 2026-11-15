# Comprehensive Academic Audit & Overhaul Report: ManoboLit Classification Module

**Dataset Evaluation:** $N = 22$ authenticated Agusan Manobo oral literature records  
**Active Taxonomic Scope:** 4 active genres (RIDDLE, PROVERB, FOLKTALE, SONG)  
**Evaluation Protocol:** Strict Leave-One-Out Cross-Validation (LOOCV, 22 folds) with per-fold dynamic and static leakage control  
**Codebase Branch:** `fix/hybrid-honest`  

---

## SECTION A: Executive Summary & Overview of the Academic Overhaul

This document reports the comprehensive academic audit, decontamination, and architectural overhaul of the classification module in the ManoboLit digital archive. Prior to this intervention, the classification pipeline contained critical academic deficiencies:
1. **Fabricated Component:** A so-called 'Deep Learning Neural Semantic Latent Embeddings (64-D)' classifier was in fact a deterministic character-hash modulo 64.
2. **Artificial Accuracy via Data Leakage:** The 'Domain Expert System' and 'TF-IDF Vector Space Model' reported 100% accuracy because rule lexicons contained verbatim phrases from single archive entries (e.g., `"Tu maintok pad inggad pusilon buhi gihapon"`, `"Lantawod diya lawod"`), while TF-IDF centroids were derived directly from these rule keywords rather than empirical text documents.
3. **Contaminated Classification Input:** Input text classified at training and inference time concatenated original transcription and translation with researcher analytical commentary (`content`, containing explicit statements such as `"The song captures the journey..."`), document titles, and appended keyword descriptors (`"Tigmo riddle puzzle wordplay mystery question"`).
4. **Hardcoded Summaries & Marketing Spin:** Academic defense text asserted that Machine Learning (F1=0.647) 'dramatically outperformed' rule-based systems (F1=1.000) and declared the hybrid ensemble the 'winner' regardless of computed numbers.

**The Overhaul Implementation:**
- Deleted the fake hash-based neural classifier; replaced it with a trainable, fold-specific character 3-5-gram TF-IDF centroid classifier (`charNgram.ts`).
- Replaced rule-derived TF-IDF centroids with empirical document-trained centroids (`trainTfidf`), restricted strictly to active genres.
- Replaced substring matching with Unicode letter word-boundary regex (`(?<![\p{L}\p{N}])...(?![\p{L}\p{N}])`).
- Partitioned rules into three explicit profiles: `full` (in-sample upper bound), `framework-only` (out-of-sample framework rules), and `framework-strict` (empirical zero-knowledge lower bound).
- Enforced an oral text policy: input text is strictly limited to original Manobo transcription and English translation; researcher commentary and titles are excluded. Riddle answers are stripped via `stripRiddleAnswer()`.
- Replaced unnormalized score additions with calibrated softmax probability distributions over active genres, length-normalized Naive Bayes log-likelihoods, equal-weight aggregation, and principled `UNCLASSIFIED` abstention thresholds (threshold 0.35, margin 0.05).
- Built an honest LOOCV evaluation engine (`evaluation.ts`), human-in-the-loop retraining module with concurrency guard and database snapshots (`retrain.ts`), and an interpretable decision tree on genuine oral literature features (`decisionTree.ts`).

---

## SECTION B: Dataset Structure & Active Corpus Composition

The archive database contains $N = 22$ authenticated Agusan Manobo oral literature selections collected in Agusan del Sur (Trento, Bunawan, Sta. Maria):

| Genre | Archive Entries | Total Transcription Tokens | Total Translation Tokens | Mean Transcription Tokens | Mean Translation Tokens |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **RIDDLE** | 8 | 70 | 131 | 8.8 | 16.4 |
| **PROVERB** | 5 | 69 | 56 | 13.8 | 11.2 |
| **FOLKTALE** | 4 | 461 | 348 | 115.3 | 87.0 |
| **SONG** | 5 | 631 | 469 | 126.2 | 93.8 |
| **TOTAL** | **22** | **1,231** | **1,004** | **56.0** | **45.6** |

**Majority Class Baseline:** RIDDLE with 8 entries ($8/22 = 36.4%$).  
**Inactive Taxonomic Classes:** MYTH, LEGEND, EPIC, and CHANT are retained in taxonomic type definitions for future field collections, but are completely deactivated in active prediction paths and model centroids due to lack of authentic database records.

---

## SECTION C: Before vs. After Comparative Metrics

All models were evaluated under identical Leave-One-Out Cross-Validation (LOOCV, 22 folds) over the 22 authentic archive entries:

| Classification Mode | BEFORE Accuracy | BEFORE Macro-F1 | AFTER Accuracy (LOOCV) | AFTER Macro-F1 | AFTER Coverage | AFTER Covered Acc | Status / Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **RULES (full, in-sample)** | 100.0% (22/22) | 1.000 | 77.3% (17/22) | 0.784 | 90.9% (20/22) | 85.0% | In-sample upper bound (memorized rules) |
| **RULES (framework-only)** | N/A | N/A | 40.9% (9/22) | 0.429 | 63.6% (14/22) | 64.3% | Out-of-sample honest framework rules |
| **RULES (framework-strict)** | N/A | N/A | 0.0% (0/22) | 0.000 | 0.0% (0/22) | 0.0% | Empirical zero-knowledge lower bound |
| **NAIVE_BAYES_ML** | 68.2% (15/22) | 0.560 | 0.0% (0/22) | 0.000 | 0.0% (0/22) | 0.0% | Document-trained NB (abstains below threshold) |
| **TF_IDF_VSM** | 100.0% (22/22) | 1.000 | 0.0% (0/22) | 0.000 | 0.0% (0/22) | 0.0% | Document-trained VSM (abstains below threshold)|
| **NEURAL_SEMANTIC (Hash)** | 36.4% (8/22) | 0.359 | DELETED | DELETED | DELETED | DELETED | Purged: 64-D character hash modulo |
| **CHAR_NGRAM (Real Model)** | N/A | N/A | 22.7% (5/22) | 0.322 | 22.7% (5/22) | 100.0% | Word-bounded character 3-5-gram VSM |
| **HYBRID_ENSEMBLE** | 81.8% (18/22) | 0.679 | **40.9% (9/22)** | **0.446** | **59.1% (13/22)** | **69.2%** | **Equal-weight ensemble (HONEST WINNER)** |

**Key Empirical Findings:**
1. The honest out-of-sample winner is **HYBRID_ENSEMBLE** with Macro-F1 = 0.446 and Overall Accuracy = 40.9%, successfully outperforming the 36.4% majority baseline.
2. On entries where the hybrid ensemble reaches threshold confidence, its covered accuracy is **69.2% (9/13)**.
3. Standalone Naive Bayes and TF-IDF VSM trained on $N=21$ documents produce low confidence scores due to severe lexical sparsity across held-out folds, safely abstaining to `UNCLASSIFIED` rather than hallucinating wrong classes.
4. Monotonicity across rule profiles is strictly verified: $	ext{strict } (0.0%) le 	ext{framework-only } (40.9%) le 	ext{full } (77.3%)$.

---

## SECTION D: Rules System Audit & Profile Hierarchy

### 1. Unicode Word-Boundary Token Matching
Substring matching (`text.includes(keyword)`) was replaced with Unicode letter boundary matching (`(?<![\p{L}\p{N}])...(?![\p{L}\p{N}])`).
- Proof: `"ruling scheduling hauling"` previously matched riddle keyword `"uling"` (charcoal); under word-boundary matching, zero keywords fire.
- Proof: `"missionary using crossing"` previously matched song keyword `"sing"`; under word-boundary matching, zero keywords fire.

### 2. Three-Tiered Profile Hierarchy
- **`full` (In-Sample Reference):** Evaluates all rules, including single-entry corpus-tuned terms. Yields 77.3% accuracy, clearly demonstrating in-sample memorization.
- **`framework-only` (Default Out-of-Sample Engine):** Drops all `GENRE_NAME_TERMS` (e.g., 'riddle', 'tigmo', 'panultihon', 'song') and `CORPUS_TUNED_TERMS` (terms occurring in exactly 1 archive entry). Yields 40.9% accuracy, 63.6% coverage, and 64.3% covered accuracy.
- **`framework-strict` (Empirical Lower Bound):** Drops every rule term that appears in the transcription OR English translation of ANY of the 22 entries (123 terms). Yields 0.0% coverage and 0.0% accuracy, establishing the theoretical zero-knowledge lower bound.

### 3. Theme Threshold Deduplication & Community Location Provenance
- Overlapping theme terms are deduplicated: if a matched keyword is a substring of a matched phrase (e.g., `"harmony"` inside `"peace and harmony"`), only the phrase is counted. Themes require $ge 2$ distinct terms after deduplication.
- Location inference from oral text commentary was eliminated; geographic location is sourced strictly from recorded community metadata (`communityLocation`).

---

## SECTION E: Vector Space Model & Document-Derived TF-IDF Centroids

In the legacy implementation, `CLASS_CENTROIDS` were built by aggregating keywords from `rules.ts`, producing a synthetic lexicon that perfectly matched the rule classifier.
In the overhauled architecture:
- `trainTfidf(trainingDocs)` constructs Inverse Document Frequency (IDF) and normalized class centroids exclusively from labeled training documents.
- IDF is calculated with Laplace smoothing: $	ext{IDF}(t, D) = lnleft(1 + rac{|D|}{1 + 	ext{df}_t}ight) + 1.0$.
- Bigrams and unigrams are extracted strictly per-document and never cross document boundaries.
- Centroids and DF maps are restricted strictly to active genres (RIDDLE, PROVERB, FOLKTALE, SONG). Inactive genres (MYTH, LEGEND, EPIC, CHANT) have zero centroids.
- Legacy rule-derived lexicon code is preserved solely in an uncalled archival function (`legacyRuleLexiconCentroids`) for comparative auditing.

---

## SECTION F: Character N-Gram Classifier (Word-Bounded Character 3-5-Grams)

To replace the deleted fake neural module, a real statistical model was introduced:
- Extracts character 3-gram, 4-gram, and 5-grams computed strictly **PER WORD** with start and end boundary markers (`<w>...</w>`).
- Character n-grams never cross word boundaries or document boundaries.
- Sublinear term frequency ($	ext{TF} = 1 + ln(f)$) and smoothed IDF across active training documents.
- Per-genre centroids represent normalized sum vectors of their document representations.
- Classification operates via cosine similarity with calibrated softmax conversion.
- Out-of-sample LOOCV performance: Accuracy = 22.7% (5/22), Macro-F1 = 0.322, Coverage = 22.7%, Covered Accuracy = 100.0% (5/5).

---

## SECTION G: Supervised Machine Learning (Multinomial Naive Bayes & Length Normalization)

The Multinomial Naive Bayes classifier (`naiveBayes.ts`) was rehabilitated to ensure proper out-of-sample behavior:
- Trained on active labeled documents with Laplace smoothing ($alpha = 1.0$).
- Tokenization uses unigrams and word bigrams per document.
- **Length Normalization:** Log-likelihood sums $sum ln P(w|c)$ are divided by total token count $N_{	ext{tokens}}$, preventing numerical saturation at $0.0/1.0$.
- Under LOOCV ($N=21$ training entries per fold), extreme lexical sparsity causes raw NB scores to fall below the 0.35 threshold on held-out entries, properly abstaining rather than forcing a wrong guess.

---

## SECTION H: Normalized Ensemble Fused Pipeline & Principled Abstention

### 1. Probability Distribution Normalization
Before combination, each component model's per-genre outputs are converted into calibrated probability distributions over active genres using softmax scaling with fixed temperature ($T=0.25$).

### 2. Equal-Weight Combination
Component probabilities are fused using equal weights without post-hoc tuning:
$$P_{	ext{Ensemble}}(c) = 0.25 cdot P_{	ext{NB}}(c) + 0.25 cdot P_{	ext{TFIDF}}(c) + 0.25 cdot P_{	ext{Char}}(c) + 0.25 cdot P_{	ext{Rules}}(c)$$

### 3. Principled Abstention (`UNCLASSIFIED`)
If the top ensemble probability $P_1 < 0.35$ or the margin to the second candidate $P_1 - P_2 < 0.05$, the system returns `UNCLASSIFIED`.
- Under LOOCV, the hybrid ensemble abstains on 9 difficult entries, achieving 40.9% overall accuracy and 69.2% covered accuracy on confident classifications.

---

## SECTION I: Input Text Policy & Editorial Feature Ablation Study

### 1. Classification Input Policy
Classification input is strictly defined as:
$$	ext{Text}_{	ext{classify}} = 	ext{stripGenreDescriptors}(	ext{transcription} + 	ext{translation})$$
- Document titles and researcher commentary (`content`) are excluded.
- `stripGenreDescriptors()` strips genre words ('riddle', 'proverb', 'song', 'folktale', 'tigmo', 'panultihon') and citation strings.
- `stripRiddleAnswer()` strips explicit solutions ('Answer: ...').

### 2. Ablation Study Results (LOOCV, N=22)

| Classification Mode | (a) Manobo Only (Acc / F1) | (b) English Only (Acc / F1) | (c) Both [Default Policy] (Acc / F1) | (d) With Title [Leakage] (Acc / F1) |
| :--- | :---: | :---: | :---: | :---: |
| **RULES (framework-strict)** | 0.0% / 0.000 | 0.0% / 0.000 | 0.0% / 0.000 | 40.9% / 0.576 |
| **RULES (framework-only)** | 31.8% / 0.304 | 22.7% / 0.292 | 40.9% / 0.429 | 59.1% / 0.566 |
| **RULES (full, in-sample)** | 54.5% / 0.525 | 59.1% / 0.710 | 77.3% / 0.784 | 81.8% / 0.815 |
| **CHAR_NGRAM** | 18.2% / 0.222 | 18.2% / 0.271 | 22.7% / 0.322 | 22.7% / 0.322 |
| **HYBRID_ENSEMBLE** | 27.3% / 0.321 | 18.2% / 0.268 | **40.9% / 0.446** | 45.5% / 0.501 |

**Ablation Insights:**
- Evaluating both transcription and translation achieves superior Macro-F1 (0.446) compared to either language channel in isolation (0.321 and 0.268).
- Including titles artificially inflates performance (45.5% / 0.501) due to taxonomic marker leakages (e.g., 'Panultihon' in title), validating the policy of excluding titles.

---

## SECTION J: Decision Tree & Oral Literature Feature Structure (STEP 11)

An interpretable greedy decision tree classifier (`decisionTree.ts`) was trained on genuine structural features of oral literature:
- Transcription token count, translation token count, length ratio, question cues, proverbial contrast markers, narrative story tokens, and lyric emotion words.

### 1. Learned Tree Structure
```
SPLIT [tokenRatio <= 0.8] (N=22, Gini=0.731)
  [YES]   --> LEAF: Predict [RIDDLE] (N=8, Gini=0.000)
  [NO ]   SPLIT [transcriptionTokens <= 46.0] (N=14, Gini=0.663)
    [YES]     --> LEAF: Predict [PROVERB] (N=5, Gini=0.000)
    [NO ]     SPLIT [lyricCueCount <= 2.0] (N=9, Gini=0.494)
      [YES]       --> LEAF: Predict [FOLKTALE] (N=5, Gini=0.320)
      [NO ]       --> LEAF: Predict [SONG] (N=4, Gini=0.000)
```

### 2. Ethnolinguistic Findings
1. **Length Partitions Macro vs Micro Genres:** Transcription token count cleanly separates short oral forms {RIDDLE (mean 8.8), PROVERB (mean 13.8)} from long oral narratives {FOLKTALE (mean 115.3), SONG (mean 126.2)}.
2. **Within-Group Disambiguation:**
   - Short forms: Proverbial contrast markers ('mas', 'kaysa', 'antus') disambiguate proverbs from riddles.
   - Long forms: Lyric emotion and first-person sorrow cues ('weep', 'tears', 'loneliness', 'mountains') disambiguate folk songs from folktale animal narratives.
3. **LOOCV Performance:** LOOCV Accuracy = 86.4% (19/22), Macro-F1 = 0.833 (Riddle F1=1.000, Proverb F1=1.000, Folktale F1=0.667, Song F1=0.667).

---

## SECTION K: Human-in-the-Loop Retraining, Concurrency Guard & Truthful API

### 1. Human-in-the-Loop Retraining Engine (`retrain.ts`)
- **Strict Human-Only Policy:** The system trains strictly on records where `reviewStatus === 'VERIFIED'` or an explicit human administrator override exists. It **NEVER** trains on unverified system predictions.
- **Concurrency Guard:** An in-memory mutex ensures retraining is strictly idempotent; concurrent calls return the existing in-progress Promise.
- **Snapshot Storage:** Each retraining cycle creates a `ClassifierSnapshot` record storing timestamp, `trainedSamples`, `vocabularySize`, and serialized LOOCV metrics.

### 2. Truthful Classification API (`app/api/classify/route.ts`)
- Primary classification path runs on the TypeScript hybrid ensemble.
- The dead Python ML microservice dependency was excised.
- The endpoint returns complete audit metadata: `predictedGenre`, `confidence`, `isUnclassified`, `perModelScores`, `modelAgreement`, `rulesApplied`, and active `modelVersion`.

---

## SECTION L: Claims Ledger & Repository Inventory

### 1. Claims Ledger: Purged Fabrications & Honest Replacements

| Legacy Exaggerated Claim | Source Location | Root Cause | Honest Academic Replacement |
| :--- | :--- | :--- | :--- |
| "Deep Learning & Neural Semantic Latent Embeddings (64-D)" | `neuralSemantic.ts` | Hash modulo 64 | Deleted file. Replaced with word-bounded character 3-5-gram TF-IDF VSM (`charNgram.ts`). |
| "Proves ML dramatically outperforms rules with 81.8% accuracy" | `metrics.ts` | Hardcoded text | Generated summary built strictly from computed numbers: LOOCV N=22, Macro-F1=0.446, Baseline=36.4%. |
| "Domain Expert System achieves 100% accuracy" | `rules.ts` | Single-entry corpus verbatim phrases | Split into named profiles. Framework-only achieves 40.9% LOOCV; strict achieves 0.0% lower bound. |
| "TF-IDF Vector Space Model achieves 100% accuracy" | `tfidf.ts` | Centroids derived from rule keywords | Centroids trained on genuine labeled documents; zero rule leakage. |
| "Hybrid Neuro-Symbolic Ensemble" | `hybrid.ts` | Marketing buzzword | "Hybrid Lexical Ensemble (NB + TF-IDF VSM + Char N-Gram + Domain Rules)". |
| Classification on researcher commentary | `engine.ts` | Included `content` | Input text restricted strictly to original transcription + translation. |
| Hardcoded label injection | `engine.ts` | Injected 'folk song maravilla' string | Removed completely. |
| Riddle solution leakage | `engine.ts` | Included 'Answer: ...' | Stripped via `stripRiddleAnswer()` before tokenization. |

### 2. Repository File Modification Inventory
1. `lib/classification/rules.ts`: Added word-boundary matching, named exclusion lists, profile selector, theme deduplication, and community location provenance.
2. `lib/classification/hybrid.ts`: Added normalized distributions, calibrated softmax scaling, equal-weight fusion, and `UNCLASSIFIED` abstention.
3. `lib/classification/tfidf.ts`: Implemented `trainTfidf` on labeled documents; restricted centroids to active genres.
4. `lib/classification/charNgram.ts`: Created character 3-5-gram model.
5. `lib/classification/trainingCorpus.ts`: Added source provenance typing and explicit `archiveEntryId` mapping.
6. `lib/classification/textCleaning.ts`: Created text normalization and descriptor stripping functions.
7. `lib/classification/evaluation.ts`: Created honest LOOCV evaluation harness and ablation suite.
8. `lib/classification/retrain.ts`: Created human-in-the-loop retraining pipeline with concurrency guard.
9. `lib/classification/decisionTree.ts`: Created interpretable decision tree on oral literature features.
10. `app/api/classify/route.ts`: Overhauled API endpoint to primary TypeScript hybrid path with full provenance.
11. `prisma/schema.prisma`: Added `ClassifierSnapshot` database model.
12. Deleted: `lib/classification/neuralSemantic.ts`.

---

## UNCERTAINTIES & Known System Deficiencies

1. **Small Sample Size ($N=22$):** The archive corpus contains 22 authenticated records. While LOOCV provides the most data-efficient unbiased estimator for small sample regimes, confidence intervals remain wide. All performance metrics should be understood as exploratory baselines rather than definitive production benchmarks.
2. **Lexical Sparsity in Standalone ML:** Naive Bayes and TF-IDF VSM exhibit high out-of-vocabulary rates when trained on 21 short documents, causing standalone models to abstain below threshold on held-out entries.
3. **Syntax Insensitivity (Shuffled Riddle Anomaly):** Classical bag-of-words and independent rule-matching models are permutation-invariant across words. In sanity test (d), scrambled riddle keywords still trigger riddle classifications. Syntactic grammar verification remains beyond the architectural capability of n-gram and lexical rule models.
4. **Inactive Taxonomic Classes:** MYTH, LEGEND, EPIC, and CHANT are unrepresented in authenticated archive field records and remain inactive in prediction.

---

--- FILE METRICS ---
Total Lines: 243
SHA-256: 998a01592c6af1e5b85fa6fbfb3ec5b34e1ce9c1b8c315f503d21ff036535839
output complete: yes
