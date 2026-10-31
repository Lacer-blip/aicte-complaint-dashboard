import json
from pathlib import Path
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Institution, Complaint, AuditLog


PROJECT_DIR = Path(__file__).resolve().parent.parent
GROUND_TRUTH_PATH = PROJECT_DIR / "data" / "ground_truth.json"


def generate_data():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        existing_case = db.scalar(
            select(Complaint.id)
            .where(Complaint.case_number.like("SYN-%"))
            .limit(1)
        )

        if existing_case is not None:
            print("Synthetic dataset already exists. Skipping generation.")
            return

        # Each pair of records represents the same underlying institution.
        institution_data = [
            {
                "permanent_id": None,
                "name": "Central Institute of Technology",
                "district": "Bhopal",
                "pincode": "462003",
            },
            {
                "permanent_id": None,
                "name": "Central Inst. of Technology",
                "district": "Bhopal",
                "pincode": "462003",
            },
            {
                "permanent_id": None,
                "name": "National Engineering College",
                "district": "Indore",
                "pincode": "452001",
            },
            {
                "permanent_id": None,
                "name": "National Engg College",
                "district": "Indore",
                "pincode": "452001",
            },
            {
                "permanent_id": None,
                "name": "Malwa Institute of Technology",
                "district": "Ujjain",
                "pincode": "456010",
            },
            {
                "permanent_id": None,
                "name": "Malwa Inst. Technology",
                "district": "Ujjain",
                "pincode": "456010",
            },
            {
                "permanent_id": None,
                "name": "Vindhya College of Engineering",
                "district": "Rewa",
                "pincode": "486001",
            },
            {
                "permanent_id": None,
                "name": "Vindhya Engg. College",
                "district": "Rewa",
                "pincode": "486001",
            },

            # Similar names, but deliberately different institutions.
            {
                "permanent_id": None,
                "name": "Central Institute of Technology",
                "district": "Indore",
                "pincode": "452001",
            },
            {
                "permanent_id": None,
                "name": "Central Institute of Technology",
                "district": "Jabalpur",
                "pincode": "482001",
            },
        ]

        institutions = [
            Institution(
                permanent_id=item["permanent_id"],
                name=item["name"],
                district=item["district"],
                state="Madhya Pradesh",
                pincode=item["pincode"],
            )
            for item in institution_data
        ]

        db.add_all(institutions)
        db.flush()

        now = datetime.now(timezone.utc)

        # The first eight cases form four planted positive pairs.
        complaint_data = [
            (0, "SYN-RB-001", "Regional Bureau", "Faculty shortage"),
            (1, "SYN-PGRC-001", "PGRC", "Faculty availability"),
            (2, "SYN-RB-002", "Regional Bureau", "Laboratory facilities"),
            (3, "SYN-PGRC-002", "PGRC", "Infrastructure grievance"),
            (4, "SYN-RB-003", "Regional Bureau", "Library facilities"),
            (5, "SYN-PGRC-003", "PGRC", "Library resources"),
            (6, "SYN-RB-004", "Regional Bureau", "Examination issue"),
            (7, "SYN-PGRC-004", "PGRC", "Examination grievance"),

            # Similar institution names, but these are different entities.
            (8, "SYN-RB-005", "Regional Bureau", "Campus infrastructure"),
            (9, "SYN-PGRC-005", "PGRC", "Campus infrastructure"),
        ]

        complaints = []

        for index, case_number, bureau, subject in complaint_data:
            complaints.append(
                Complaint(
                    case_number=case_number,
                    institution_id=institutions[index].id,
                    bureau=bureau,
                    subject=subject,
                    description=(
                        "Synthetic demonstration complaint. "
                        "This record is not an actual government complaint."
                    ),
                    status="Open",
                    assigned_officer=f"Demo Officer {index + 1}",
                    received_at=now - timedelta(days=index + 2),
                    due_at=now + timedelta(days=10 - index),
                )
            )

        db.add_all(complaints)
        db.flush()

        db.add(
            AuditLog(
                actor="System",
                action="SYNTHETIC_DATA_GENERATED",
                entity_type="Dataset",
                entity_id="SIH-DEMO-001",
                details="Synthetic demonstration records generated.",
            )
        )

        db.commit()

        positive_pairs = [
            ["SYN-RB-001", "SYN-PGRC-001"],
            ["SYN-RB-002", "SYN-PGRC-002"],
            ["SYN-RB-003", "SYN-PGRC-003"],
            ["SYN-RB-004", "SYN-PGRC-004"],
        ]

        negative_pairs = [
            ["SYN-RB-005", "SYN-PGRC-005"],
        ]

        ground_truth = {
            "dataset": "AICTE SIH synthetic demonstration dataset",
            "synthetic": True,
            "description": (
                "Positive pairs refer to the same underlying institution. "
                "Negative pairs refer to different institutions with similar names."
            ),
            "positive_pairs": positive_pairs,
            "negative_pairs": negative_pairs,
        }

        GROUND_TRUTH_PATH.write_text(
            json.dumps(ground_truth, indent=4),
            encoding="utf-8",
        )

        print("Synthetic dataset generated successfully.")
        print(f"Institutions added: {len(institutions)}")
        print(f"Complaints added: {len(complaints)}")
        print("Positive ground-truth pairs: 4")
        print("Negative ground-truth pairs: 1")
        print(f"Ground truth saved to: {GROUND_TRUTH_PATH}")


if __name__ == "__main__":
    generate_data()