import os
import unittest
from ml.preprocessing import clean_text, combine_entry_fields, compute_content_hash
from ml.pipeline import build_candidate_pipelines
from ml.dataset import filter_verified_records, compute_dataset_summary
from ml.rules_classifier import classify_with_rules
from ml.evaluate_model import evaluate_pipeline, evaluate_rules_baseline, check_promotion_criteria
from ml.predict import predict_entry, get_active_version
from ml.retrain import acquire_lock, release_lock, LOCK_FILE

class TestManoboLitMLPipeline(unittest.TestCase):

    def test_text_preprocessing(self):
        text = "Lantawod diya lawod nig duma kan bayod... og-ilaan te mga bituen!"
        cleaned = clean_text(text)
        self.assertIn("og-ilaan", cleaned)  # preserves hyphens in Manobo affixes
        self.assertNotIn("...", cleaned)    # cleans punctuation

    def test_content_hashing_consistency(self):
        entry = {
            "title": "Creation of Stars",
            "transcription": "d-anak te meogingon so mga bituen",
            "translation": "The stars were born from breath",
            "content": "Sacred origin myth"
        }
        hash1 = compute_content_hash(entry)
        hash2 = compute_content_hash(entry)
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64)  # SHA-256 length

        # Changing content must change hash
        entry_modified = dict(entry, content="Modified origin myth")
        hash3 = compute_content_hash(entry_modified)
        self.assertNotEqual(hash1, hash3)

    def test_dataset_verification_filtering(self):
        raw_entries = [
            # 1. Verified and unchanged hash -> admitted
            {
                "id": "1",
                "title": "Song 1",
                "content": "Singing about mountains",
                "reviewStatus": "VERIFIED",
                "verifiedGenre": "SONG",
                "contentHash": "abc123hash",
                "verifiedContentHash": "abc123hash"
            },
            # 2. Pending -> excluded
            {
                "id": "2",
                "title": "Pending Song",
                "content": "Singing about mountains",
                "reviewStatus": "PENDING",
                "genre": "SONG"
            },
            # 3. Uncertain -> excluded
            {
                "id": "3",
                "title": "Uncertain Entry",
                "content": "Some text",
                "reviewStatus": "UNCERTAIN",
                "genre": "FOLKTALE"
            },
            # 4. Modified text after verification (hash mismatch) -> excluded
            {
                "id": "4",
                "title": "Modified Record",
                "content": "Edited text after curator verified",
                "reviewStatus": "VERIFIED",
                "verifiedGenre": "PROVERB",
                "contentHash": "different_hash_now",
                "verifiedContentHash": "original_verified_hash"
            }
        ]

        verified, stats = filter_verified_records(raw_entries)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["id"], "1")
        self.assertEqual(stats["excluded_pending"], 1)
        self.assertEqual(stats["excluded_uncertain"], 1)
        self.assertEqual(stats["excluded_hash_mismatch"], 1)

    def test_rule_classifier_baseline(self):
        # Riddle test
        riddle_text = "What am I? Tigmo riddle puzzle wordplay mystery question tu maintok pad inggad pusilon buhi gihapon"
        res = classify_with_rules(riddle_text)
        self.assertEqual(res["predicted_genre"], "RIDDLE")
        self.assertEqual(res["prediction_source"], "RULE_BASED")

    def test_candidate_pipelines_building(self):
        pipelines = build_candidate_pipelines()
        self.assertIn("LogisticRegression", pipelines)
        self.assertIn("LinearSVC_Calibrated", pipelines)
        self.assertIn("MultinomialNB", pipelines)

        train_texts = [
            "What am I? Riddle puzzle answer is charcoal uling tigmo",
            "Riddle question answer is coconut lubi tigmo",
            "This proverb teaches integrity and resisting temptation panultihon",
            "Proverb on patience and suffering hunger rather than wrongdoing panultihon",
            "We sing of mountains bare and lost wealth folk song maravilla",
            "The song conveys sorrow and hardship of my situation folk song"
        ]
        train_labels = ["RIDDLE", "RIDDLE", "PROVERB", "PROVERB", "SONG", "SONG"]

        for name, pipe in pipelines.items():
            pipe.fit(train_texts, train_labels)
            preds = pipe.predict(["Tigmo riddle about coconut"])
            self.assertEqual(len(preds), 1)
            self.assertIn(preds[0], ["RIDDLE", "PROVERB", "SONG"])

    def test_conditional_promotion_checks(self):
        # Candidate worse than baseline -> REJECTED
        cand_metrics_bad = {"macro_f1": 0.40, "sample_size": 10, "per_class": {}}
        baseline_metrics = {"macro_f1": 0.70, "sample_size": 10}
        promoted, reason = check_promotion_criteria(cand_metrics_bad, baseline_metrics)
        self.assertFalse(promoted)
        self.assertIn("does not meet", reason.lower())

        # Candidate better than baseline -> ACTIVATED
        cand_metrics_good = {
            "macro_f1": 0.85,
            "sample_size": 10,
            "per_class": {
                "SONG": {"recall": 0.8, "support": 4},
                "RIDDLE": {"recall": 0.9, "support": 6}
            }
        }
        promoted_good, reason_good = check_promotion_criteria(cand_metrics_good, baseline_metrics)
        self.assertTrue(promoted_good)
        self.assertIn("passed all checks", reason_good.lower())

    def test_concurrency_lock(self):
        release_lock()
        acquired1 = acquire_lock()
        self.assertTrue(acquired1)
        acquired2 = acquire_lock()
        self.assertFalse(acquired2)  # Duplicate overlapping job must be prevented!
        release_lock()

if __name__ == "__main__":
    unittest.main()
