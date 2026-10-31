import unittest
from datetime import datetime, timedelta
from types import SimpleNamespace

from app.sla import get_sla_status, calculate_metrics


class SLATests(unittest.TestCase):

    def setUp(self):
        self.now = datetime(2026, 10, 31, 12, 0, 0)

    def make_case(self, status, due_at=None):
        return SimpleNamespace(
            status=status,
            due_at=due_at
        )

    def test_closed_complaint(self):
        case = self.make_case(
            "Resolved",
            self.now - timedelta(days=2)
        )

        self.assertEqual(
            get_sla_status(case, self.now),
            "CLOSED"
        )

    def test_complaint_without_deadline(self):
        case = self.make_case("Open")

        self.assertEqual(
            get_sla_status(case, self.now),
            "NO_DEADLINE"
        )

    def test_overdue_complaint(self):
        case = self.make_case(
            "Open",
            self.now - timedelta(hours=1)
        )

        self.assertEqual(
            get_sla_status(case, self.now),
            "OVERDUE"
        )

    def test_due_soon_complaint(self):
        case = self.make_case(
            "In Progress",
            self.now + timedelta(hours=24)
        )

        self.assertEqual(
            get_sla_status(case, self.now),
            "DUE_SOON"
        )

    def test_complaint_on_track(self):
        case = self.make_case(
            "Open",
            self.now + timedelta(days=5)
        )

        self.assertEqual(
            get_sla_status(case, self.now),
            "ON_TRACK"
        )


class EvaluationTests(unittest.TestCase):

    def test_perfect_predictions(self):
        actual = [
            ("CASE-001", "CASE-002"),
            ("CASE-003", "CASE-004"),
        ]

        predicted = [
            ("CASE-002", "CASE-001"),
            ("CASE-003", "CASE-004"),
        ]

        result = calculate_metrics(actual, predicted)

        self.assertEqual(result["true_positives"], 2)
        self.assertEqual(result["false_positives"], 0)
        self.assertEqual(result["false_negatives"], 0)
        self.assertEqual(result["precision"], 1.0)
        self.assertEqual(result["recall"], 1.0)
        self.assertEqual(result["f1_score"], 1.0)

    def test_false_positive_and_false_negative(self):
        actual = [
            ("CASE-001", "CASE-002"),
            ("CASE-003", "CASE-004"),
        ]

        predicted = [
            ("CASE-001", "CASE-002"),
            ("CASE-005", "CASE-006"),
        ]

        result = calculate_metrics(actual, predicted)

        self.assertEqual(result["true_positives"], 1)
        self.assertEqual(result["false_positives"], 1)
        self.assertEqual(result["false_negatives"], 1)
        self.assertEqual(result["precision"], 0.5)
        self.assertEqual(result["recall"], 0.5)
        self.assertEqual(result["f1_score"], 0.5)

    def test_no_predictions(self):
        result = calculate_metrics(
            [("CASE-001", "CASE-002")],
            []
        )

        self.assertEqual(result["precision"], 0.0)
        self.assertEqual(result["recall"], 0.0)
        self.assertEqual(result["f1_score"], 0.0)


if __name__ == "__main__":
    unittest.main()