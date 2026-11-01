
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Institution, Complaint
from app.overlap import detect_overlaps
from app.sla import get_sla_status


router = APIRouter(prefix="/api", tags=["Dashboard API"])


VALID_ROLES = {
    "RB",
    "PGRC",
    "OTHER_BUREAU",
    "REGIONAL",
    "MANAGEMENT",
    "ADMIN",
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_role(x_demo_role: str = Header(...)):
    """
    Prototype role authentication.
    This is a demo header, not secure production authentication.
    """

    role = x_demo_role.strip().upper()

    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Invalid or unauthorized demo role."
        )

    return role


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    complaints = db.query(Complaint).all()

    active_count = sum(
        1 for case in complaints
        if get_sla_status(case) != "CLOSED"
    )

    overdue_count = sum(
        1 for case in complaints
        if get_sla_status(case) == "OVERDUE"
    )

    due_soon_count = sum(
        1 for case in complaints
        if get_sla_status(case) == "DUE_SOON"
    )

    institutions_count = db.query(Institution).count()

    overlaps = detect_overlaps(complaints)

    return {
        "role": role,
        "total_complaints": len(complaints),
        "active_complaints": active_count,
        "overdue_complaints": overdue_count,
        "due_soon_complaints": due_soon_count,
        "total_institutions": institutions_count,
        "active_overlaps": len(overlaps),
        "synthetic_data": True,
    }


@router.get("/complaints")
def list_complaints(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    complaints = db.query(Complaint).order_by(
        Complaint.received_at.desc()
    ).all()

    return {
        "role": role,
        "count": len(complaints),
        "complaints": [
            {
                "id": case.id,
                "case_number": case.case_number,
                "institution_id": case.institution_id,
                "bureau": case.bureau,
                "subject": case.subject,
                "description": case.description,
                "status": case.status,
                "assigned_officer": case.assigned_officer,
                "received_at": case.received_at,
                "due_at": case.due_at,
                "sla_status": get_sla_status(case),
            }
            for case in complaints
        ],
        "synthetic_data": True,
    }


@router.get("/overlaps")
def list_overlaps(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    complaints = db.query(Complaint).all()

    overlaps = detect_overlaps(complaints)

    return {
        "role": role,
        "count": len(overlaps),
        "overlaps": overlaps,
        "synthetic_data": True,
    }
