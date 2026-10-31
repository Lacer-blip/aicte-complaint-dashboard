
import unittest

from app.database import SessionLocal
from app.models import Institution
from app.resolver import resolve_institution


class InstitutionResolverTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with SessionLocal() as db:
            cls.institutions = db.query(Institution).all()

    def test_permanent_id_match(self):
        result = resolve_institution(
            name="Some Different Name",
            district="Unknown",
            state="Unknown",
            pincode="000000",
            permanent_id="AICTE-MP-001",
            candidates=self.institutions
        )

        self.assertEqual(result["decision"], "MATCHED_EXACT")
        self.assertEqual(result["confidence"], "CONFIRMED")

    def test_exact_identity_match(self):
        result = resolve_institution(
            name="Central Institute of Technology",
            district="Bhopal",
            state="Madhya Pradesh",
            pincode="462003",
            candidates=self.institutions
        )

        self.assertEqual(result["decision"], "MATCHED_EXACT")

    def test_fuzzy_variation_requires_review(self):
        result = resolve_institution(
            name="Central Institute Technology",
            district="Bhopal",
            state="Madhya Pradesh",
            pincode="462003",
            candidates=self.institutions
        )

        self.assertEqual(result["decision"], "REVIEW_REQUIRED")
        self.assertIn(
            result["confidence"],
            ["PROBABLE", "POSSIBLE"]
        )

    def test_unknown_location_not_automatically_matched(self):
        result = resolve_institution(
            name="Central Institute of Technology",
            district="Gwalior",
            state="Madhya Pradesh",
            pincode="474001",
            candidates=self.institutions
        )

        self.assertNotEqual(
            result["decision"],
            "MATCHED_EXACT"
        )

    def test_missing_name(self):
        result = resolve_institution(
            name="",
            district="Bhopal",
            state="Madhya Pradesh",
            pincode="462003",
            candidates=self.institutions
        )

        self.assertEqual(result["decision"], "INVALID")


if __name__ == "__main__":
    unittest.main()
