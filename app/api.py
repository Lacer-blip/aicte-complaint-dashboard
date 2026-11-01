from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import AuditLog, Complaint, Institution
from app.overlap import detect_overlaps
from app.sla import get_sla_status

router = APIRouter(prefix="/api", tags=["Dashboard and Operations"])

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


def get_current_role(
    x_demo_role: str = Header(..., alias="X-Demo-Role")
):
    role = x_demo_role.strip().upper()

    if role not in VALID_ROLES:
        raise HTTPException(status_code=403, detail="Invalid demo role")

    return role


def serialize_institution(institution):
    return {
        "id": institution.id,
        "permanent_id": institution.permanent_id,
        "name": institution.name,
        "district": institution.district,
        "state": institution.state,
        "pincode": institution.pincode,
    }


def serialize_complaint(complaint):
    return {
        "id": complaint.id,
        "case_number": complaint.case_number,
        "institution_id": complaint.institution_id,
        "institution_name": (
            complaint.institution.name if complaint.institution else None
        ),
        "bureau": complaint.bureau,
        "subject": complaint.subject,
        "description": complaint.description,
        "status": complaint.status,
        "assigned_officer": complaint.assigned_officer,
        "received_at": (
            complaint.received_at.isoformat()
            if complaint.received_at else None
        ),
        "due_at": (
            complaint.due_at.isoformat()
            if complaint.due_at else None
        ),
        "sla_status": get_sla_status(complaint.due_at, complaint.status),
    }


def serialize_audit_log(log):
    return {
        "id": log.id,
        "actor": log.actor,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "details": log.details,
        "created_at": (
            log.created_at.isoformat() if log.created_at else None
        ),
    }


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    complaints = db.query(Complaint).all()
    overlaps = detect_overlaps(complaints)

    active = [
        case for case in complaints
        if case.status.strip().lower()
        not in {"closed", "resolved", "disposed", "rejected"}
    ]

    overdue = sum(
        1 for case in active
        if get_sla_status(case.due_at, case.status) == "OVERDUE"
    )

    due_soon = sum(
        1 for case in active
        if get_sla_status(case.due_at, case.status) == "DUE_SOON"
    )

    return {
        "total_complaints": len(complaints),
        "active_complaints": len(active),
        "overdue_complaints": overdue,
        "due_soon_complaints": due_soon,
        "total_institutions": db.query(Institution).count(),
        "potential_overlaps": len(overlaps),
        "synthetic_data": True,
        "role": role,
    }


@router.get("/complaints")
def list_complaints(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    complaints = (
        db.query(Complaint)
        .order_by(Complaint.received_at.desc())
        .all()
    )

    return {
        "count": len(complaints),
        "items": [serialize_complaint(case) for case in complaints],
        "synthetic_data": True,
    }


@router.get("/complaints/{case_number}")
def complaint_detail(
    case_number: str,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.case_number == case_number)
        .first()
    )

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    audit_logs = (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == "complaint")
        .order_by(AuditLog.created_at.desc())
        .all()
    )

    case_history = [
        serialize_audit_log(log)
        for log in audit_logs
        if str(log.entity_id) == str(complaint.id)
    ]

    return {
        "complaint": serialize_complaint(complaint),
        "institution": (
            serialize_institution(complaint.institution)
            if complaint.institution else None
        ),
        "audit_history": case_history,
        "synthetic_data": True,
    }


@router.get("/institutions")
def list_institutions(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    institutions = (
        db.query(Institution)
        .order_by(Institution.name.asc())
        .all()
    )

    return {
        "count": len(institutions),
        "items": [
            {
                **serialize_institution(institution),
                "complaint_count": len(institution.complaints),
            }
            for institution in institutions
        ],
        "synthetic_data": True,
    }


@router.get("/institutions/{institution_id}")
def institution_detail(
    institution_id: int,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    institution = (
        db.query(Institution)
        .filter(Institution.id == institution_id)
        .first()
    )

    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    complaints = sorted(
        institution.complaints,
        key=lambda case: case.received_at,
        reverse=True,
    )

    return {
        "institution": serialize_institution(institution),
        "complaint_count": len(complaints),
        "complaints": [
            serialize_complaint(case) for case in complaints
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
        "count": len(overlaps),
        "items": overlaps,
        "synthetic_data": True,
    }