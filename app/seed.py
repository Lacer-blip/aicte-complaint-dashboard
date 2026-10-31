from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Institution, Complaint, AuditLog


def seed_database():
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        existing = db.scalar(
            select(Institution.id).limit(1)
        )

        if existing is not None:
            print("Database already contains data. Skipping seed.")
            return

        institutions = [
            Institution(
                permanent_id="AICTE-MP-001",
                name="Central Institute of Technology",
                district="Bhopal",
                state="Madhya Pradesh",
                pincode="462003",
            ),
            Institution(
                permanent_id="AICTE-MP-002",
                name="National Engineering College",
                district="Indore",
                state="Madhya Pradesh",
                pincode="452001",
            ),
            Institution(
                permanent_id="AICTE-MP-003",
                name="State Institute of Technology",
                district="Jabalpur",
                state="Madhya Pradesh",
                pincode="482001",
            ),
        ]

        db.add_all(institutions)
        db.flush()

        now = datetime.now(timezone.utc)

        complaints = [
            Complaint(
                case_number="RB-2026-001",
                institution_id=institutions[0].id,
                bureau="Regional Bureau",
                subject="Faculty shortage complaint",
                description="Complaint regarding shortage of teaching faculty.",
                status="Open",
                assigned_officer="Officer A",
                received_at=now - timedelta(days=8),
                due_at=now + timedelta(days=7),
            ),
            Complaint(
                case_number="PGRC-2026-014",
                institution_id=institutions[0].id,
                bureau="PGRC",
                subject="Faculty availability issue",
                description="Representation concerning availability of faculty members.",
                status="Under Review",
                assigned_officer="Officer B",
                received_at=now - timedelta(days=5),
                due_at=now + timedelta(days=10),
            ),
            Complaint(
                case_number="RB-2026-002",
                institution_id=institutions[1].id,
                bureau="Regional Bureau",
                subject="Infrastructure concerns",
                description="Complaint regarding laboratory infrastructure.",
                status="Open",
                assigned_officer="Officer C",
                received_at=now - timedelta(days=3),
                due_at=now + timedelta(days=12),
            ),
            Complaint(
                case_number="PGRC-2026-015",
                institution_id=institutions[2].id,
                bureau="PGRC",
                subject="Examination grievance",
                description="Complaint regarding examination procedures.",
                status="Closed",
                assigned_officer="Officer D",
                received_at=now - timedelta(days=30),
                due_at=now - timedelta(days=10),
            ),
        ]

        db.add_all(complaints)
        db.flush()

        audit_entries = [
            AuditLog(
                actor="System",
                action="SEED_CREATED",
                entity_type="Institution",
                entity_id=str(institution.id),
                details="Synthetic demonstration institution created.",
            )
            for institution in institutions
        ]

        db.add_all(audit_entries)
        db.commit()

        print("Synthetic demo database created successfully.")
        print(f"Institutions: {len(institutions)}")
        print(f"Complaints: {len(complaints)}")
        print(f"Audit entries: {len(audit_entries)}")


if __name__ == "__main__":
    seed_database()