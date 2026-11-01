from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import AuditLog, Complaint, Institution
from app.overlap import detect_overlaps
from app.sla import get_sla_status

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth import (
    authenticate_user,
    create_access_token,
    get_user_from_token,
)

class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter(prefix="/api", tags=["Dashboard and Operations"])

@router.post("/auth/login")
def login(request: LoginRequest):
    user = authenticate_user(request.username, request.password)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
        )

    token = create_access_token(
        user["username"],
        user["role"],
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "expires_in": 28800,
    }


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


security = HTTPBearer()


def get_current_role(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    payload = get_user_from_token(credentials.credentials)
    return payload["role"]

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
         "sla_status": get_sla_status(complaint),
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
        if get_sla_status(case) == "OVERDUE"
    )

    due_soon = sum(
        1 for case in active
        if get_sla_status(case) == "DUE_SOON"
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


class OverlapDecisionRequest(BaseModel):
    case_number_1: str
    case_number_2: str
    action: Literal["CONFIRM_LINK", "DISMISS", "REQUEST_COORDINATION"]
    reason: str = ""


@router.post("/overlaps/decision")
def record_overlap_decision(
    decision: OverlapDecisionRequest,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    if role not in {"RB", "PGRC", "OTHER_BUREAU", "ADMIN"}:
        raise HTTPException(
            status_code=403,
            detail="Your role cannot perform overlap review decisions",
        )
    if decision.case_number_1 == decision.case_number_2:
        raise HTTPException(
            status_code=400,
            detail="An overlap requires two different cases",
        )

    if decision.action == "DISMISS" and not decision.reason.strip():
        raise HTTPException(
            status_code=400,
            detail="A reason is required to dismiss an overlap",
        )

    first = (
        db.query(Complaint)
        .filter(Complaint.case_number == decision.case_number_1)
        .first()
    )
    second = (
        db.query(Complaint)
        .filter(Complaint.case_number == decision.case_number_2)
        .first()
    )

    if not first or not second:
        raise HTTPException(status_code=404, detail="One or both cases not found")

    detected = detect_overlaps([first, second])

    if not detected:
        raise HTTPException(
            status_code=400,
            detail="These cases are not currently detected as a potential overlap",
        )

    details = {
        "case_number_1": first.case_number,
        "case_number_2": second.case_number,
        "action": decision.action,
        "reason": decision.reason.strip(),
        "human_review": True,
        "automatic_merge": False,
    }

    audit_entry = AuditLog(
        actor=role,
        action=decision.action,
        entity_type="overlap",
        entity_id=f"{first.case_number}|{second.case_number}",
        details=json.dumps(details),
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)

    return {
        "message": "Human review decision recorded",
        "decision": details,
        "audit_id": audit_entry.id,
        "synthetic_data": True,
    }


@router.get("/audit")
def list_audit_logs(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .all()
    )

    return {
        "count": len(logs),
        "items": [serialize_audit_log(log) for log in logs],
        "synthetic_data": True,
    }


GROUND_TRUTH_PATH = Path(__file__).resolve().parent.parent / "data" / "ground_truth.json"


@router.get("/evaluation")
def evaluation(
    db: Session = Depends(get_db),
    role: str = Depends(get_current_role),
):
    if not GROUND_TRUTH_PATH.exists():
        raise HTTPException(status_code=404, detail="Ground truth file not found")

    truth = json.loads(GROUND_TRUTH_PATH.read_text(encoding="utf-8"))
    positives = {frozenset(p) for p in truth["positive_pairs"]}
    negatives = {frozenset(p) for p in truth["negative_pairs"]}

    complaints = (
        db.query(Complaint)
        .filter(Complaint.case_number.like("SYN-%"))
        .all()
    )
    predicted = {
        frozenset((o["case_1"], o["case_2"]))
        for o in detect_overlaps(complaints)
    }

    true_pos = positives & predicted
    false_neg = positives - predicted
    false_pos = predicted - positives

    precision = len(true_pos) / len(predicted) if predicted else 0.0
    recall = len(true_pos) / len(positives) if positives else 0.0
    f1 = (
        2 * precision * recall / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )

    def listify(pairs):
        return sorted(sorted(p) for p in pairs)

    return {
        "dataset": truth.get("dataset"),
        "scope": "SYN-* synthetic complaints only",
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "predicted_count": len(predicted),
        "true_positives": listify(true_pos),
        "false_positives": listify(false_pos),
        "false_negatives": listify(false_neg),
        "negative_pairs_wrongly_flagged": listify(negatives & predicted),
        "negative_pairs_total": len(negatives),
        "synthetic_data": True,
    }