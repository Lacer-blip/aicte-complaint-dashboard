import unittest
from types import SimpleNamespace

from app.overlap import detect_overlaps


def make_case(case_number, institution_id, bureau, status):
    return SimpleNamespace(
        case_number=case_number,
        institution_id=institution_id,
        bureau=bureau,
        status=status,
    )


class OverlapDetectionTests(unittest.TestCase):

    def test_detects_active_cases_across_bureaus(self):
        cases = [
            make_case("CASE-001", 1, "RB", "Open"),
            make_case("CASE-002", 1, "PGRC", "In Progress"),
        ]

        result = detect_overlaps(cases)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["confidence"], "CONFIRMED")
        self.assertTrue(result[0]["requires_human_review"])

    def test_ignores_closed_cases(self):
        cases = [
            make_case("CASE-001", 1, "RB", "Open"),
            make_case("CASE-002", 1, "PGRC", "Resolved"),
        ]

        self.assertEqual(detect_overlaps(cases), [])

    def test_ignores_different_institutions(self):
        cases = [
            make_case("CASE-001", 1, "RB", "Open"),
            make_case("CASE-002", 2, "PGRC", "Open"),
        ]

        self.assertEqual(detect_overlaps(cases), [])

    def test_ignores_same_bureau_cases(self):
        cases = [
            make_case("CASE-001", 1, "RB", "Open"),
            make_case("CASE-002", 1, "RB", "Pending"),
        ]

        self.assertEqual(detect_overlaps(cases), [])

    def test_detects_multiple_cross_bureau_pairs(self):
        cases = [
            make_case("CASE-001", 1, "RB", "Open"),
            make_case("CASE-002", 1, "PGRC", "Open"),
            make_case("CASE-003", 1, "Other Bureau", "Pending"),
        ]

        result = detect_overlaps(cases)

        self.assertEqual(len(result), 3)

    def test_bureau_comparison_ignores_case_and_extra_spaces(self):
        cases = [
            make_case("CASE-001", 1, "Regional Bureau", "Open"),
            make_case("CASE-002", 1, " regional   bureau ", "Pending"),
        ]

        self.assertEqual(detect_overlaps(cases), [])


if __name__ == "__main__":
    unittest.main()