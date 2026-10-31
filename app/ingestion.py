import csv
import re
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models import Institution, Complaint, AuditLog


def normalize_name(name: str) -> str:
    """Normalize an institution name for basic exact matching."""
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9\s]", " ", name)
    return " ".join(name.split())


def parse_date(value: str):
    """Parse an optional ISO-format date."""
    if not value or not value.strip():
        return None

    parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed


def find_institution(db, row, institution_cache):
    permanent_id = row.get("permanent_id", "").strip()

    # Permanent ID takes priority when supplied.
    if permanent_id:
        institution = db.scalar(
            select(Institution).where(
                Institution.permanent_id == permanent_id
            )
        )

        if institution:
            return institution

    name = row["institution_name"].strip()
    district = row["district"].strip()
    state = row["state"].strip()
    pincode = row["pincode"].strip()

    key = (
        normalize_name(name),
        district.lower(),
        state.lower(),
        pincode,
    )

    if key in institution_cache:
        return institution_cache[key]

    # Check existing database records.
    institutions = db.scalars(select(Institution)).all()

    for institution in institutions:
        existing_key = (
            normalize_name(institution.name),
            institution.district.lower(),
            institution.state.lower(),
            institution.pincode,
        )

        if key == existing_key:
            institution_cache[key] = institution
            return institution

    # No exact identity match: create a new institution.
    institution = Institution(
        permanent_id=permanent_id or None,
        name=name,
        district=district,
        state=state,
        pincode=pincode,
    )

    db.add(institution)
    db.flush()

    institution_cache[key] = institution
    return institution


def import_csv(file_path: str):
    Base.metadata.create_all(bind=engine)

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    required_columns = {
        "case_number",
        "institution_name",
        "district",
        "state",
        "pincode",
        "bureau",
        "subject",
        "description",
        "status",
        "assigned_officer",
    }

    imported = 0
    skipped = 0
    errors = []

    with path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)

        if not reader.fieldnames:
            raise ValueError("CSV file is empty or has no header.")

        missing = required_columns - set(reader.fieldnames)

        if missing:
            raise ValueError(
                f"Missing required CSV columns: {', '.join(sorted(missing))}"
            )

        with SessionLocal() as db:
            institution_cache = {}

            for row_number, row in enumerate(reader, start=2):
                try:
                    # Validate required values.
                    for column in required_columns:
                        if not row.get(column, "").strip():
                            raise ValueError(
                                f"Required field '{column}' is empty."
                            )

                    case_number = row["case_number"].strip()

                    # Avoid duplicate case records.
                    existing_case = db.scalar(
                        select(Complaint).where(
                            Complaint.case_number == case_number
                        )
                    )

                    if existing_case:
                        skipped += 1
                        continue

                    institution = find_institution(
                        db, row, institution_cache
                    )

                    received_at = parse_date(
                        row.get("received_at", "")
                    ) or datetime.now(timezone.utc)

                    due_at = parse_date(row.get("due_at", ""))

                    complaint = Complaint(
                        case_number=case_number,
                        institution_id=institution.id,
                        bureau=row["bureau"].strip(),
                        subject=row["subject"].strip(),
                        description=row["description"].strip(),
                        status=row["status"].strip(),
                        assigned_officer=row["assigned_officer"].strip(),
                        received_at=received_at,
                        due_at=due_at,
                    )

                    db.add(complaint)
                    db.flush()

                    db.add(
                        AuditLog(
                            actor="CSV Import",
                            action="COMPLAINT_IMPORTED",
                            entity_type="Complaint",
                            entity_id=case_number,
                            details=(
                                f"Imported from {path.name}; "
                                f"institution: {institution.name}"
                            ),
                        )
                    )

                    imported += 1

                except (ValueError, TypeError) as error:
                    errors.append(
                        f"Row {row_number}: {error}"
                    )

            db.commit()

    print("\nCSV IMPORT RESULTS")
    print("------------------")
    print(f"Imported: {imported}")
    print(f"Skipped duplicates: {skipped}")
    print(f"Invalid rows: {len(errors)}")

    for error in errors:
        print(error)


if __name__ == "__main__":
    project_dir = Path(__file__).resolve().parent.parent
    sample_file = project_dir / "data" / "import_sample.csv"

    import_csv(str(sample_file))