
import unittest
from types import SimpleNamespace

from app.overlap import detect_overlaps


def make_institution(name, district="Bhopal",
                     state="Madhya Pradesh", pincode="462003",
                     institution_id=1):

    return SimpleNamespace(
        id=institution_id,
        name=name,
        district=district,
        state=state,
        pincode=pincode,
    )


def make_case(case_number, institution, bureau, status,
              subject="Infrastructure complaint"):

    return SimpleNamespace(
        case_number=case_number,
        institution_id=institution.id,
        institution=institution,
        bureau=bureau,
        status=status,
        subject=subject,
    )


class OverlapDetectionTests(unittest.TestCase):

    def test_detects_same_institution_across_bureaus(self):
        institution = make_institution("Central Institute of Technology")

        cases = [
            make_case("CASE-001", institution, "RB", "Open"),
            make_case("CASE-002", institution, "PGRC", "In Progress"),
        ]

        result = detect_overlaps(cases)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["confidence"], "PROBABLE")
        self.assertTrue(result[0]["requires_human_review"])

    def test_detects_abbreviated_institution_name(self):
        first = make_institution(
            "Central Institute of Technology",
            institution_id=1,
        )

        second = make_institution(
            "Central Inst. of Technology",
            institution_id=2,
        )

        cases = [
            make_case("CASE-001", first, "RB", "Open"),
            make_case("CASE-002", second, "PGRC", "Open"),
        ]

        result = detect_overlaps(cases)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["confidence"], "PROBABLE")

    def test_ignores_closed_cases(self):
        institution = make_institution("Central Institute of Technology")

        cases = [
            make_case("CASE-001", institution, "RB", "Open"),
            make_case("CASE-002", institution, "PGRC", "Resolved"),
        ]

        self.assertEqual(detect_overlaps(cases), [])

    def test_ignores_different_institutions_and_locations(self):
        first = make_institution(
            "Central Institute of Technology",
            district="Bhopal",
            pincode="462003",
            institution_id=1,
        )

        second = make_institution(
            "Central Institute of Technology",
            district="Jabalpur",
            pincode="482001",
            institution_id=2,
        )

        cases = [
            make_case("CASE-001", first, "RB", "Open"),
            make_case("CASE-002", second, "PGRC", "Open"),
        ]

        self.assertEqual(detect_overlaps(cases), [])

    def test_ignores_same_bureau_cases(self):
        institution = make_institution("Central Institute of Technology")

        cases = [
            make_case("CASE-001", institution, "RB", "Open"),
            make_case("CASE-002", institution, "RB", "Pending"),
        ]

        self.assertEqual(detect_overlaps(cases), [])

    def test_subject_similarity_is_supporting_signal(self):
        first = make_institution(
            "National Engineering College",
            institution_id=1,
        )

        second = make_institution(
            "National Engg College",
            institution_id=2,
        )

        cases = [
            make_case(
                "CASE-001", first, "RB", "Open",
                "Laboratory facilities"
            ),
            make_case(
                "CASE-002", second, "PGRC", "Open",
                "Laboratory facilities"
            ),
        ]

        result = detect_overlaps(cases)

        self.assertEqual(len(result), 1)
        self.assertGreaterEqual(
            result[0]["subject_similarity"], 0.60
        )
        self.assertTrue(
            any("subject similarity" in signal
                for signal in result[0]["signals"])
        )

    def test_requires_human_review(self):
        institution = make_institution("Central Institute of Technology")

        cases = [
            make_case("CASE-001", institution, "RB", "Open"),
            make_case("CASE-002", institution, "PGRC", "Open"),
        ]

        result = detect_overlaps(cases)

        self.assertTrue(result[0]["requires_human_review"])
        self.assertNotEqual(result[0]["confidence"], "CONFIRMED")


if __name__ == "__main__":
    unittest.main()
