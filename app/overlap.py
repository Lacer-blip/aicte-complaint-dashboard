
import re
from difflib import SequenceMatcher


CLOSED_STATUSES = {
    "closed",
    "resolved",
    "disposed",
    "rejected",
}


def normalize_text(value):
    """Normalize text for deterministic comparison."""
    value = (value or "").lower().strip()

    replacements = {
        "inst.": "institute",
        "inst ": "institute ",
        "engg.": "engineering",
        "engg ": "engineering ",
        "tech.": "technology",
        "tech ": "technology ",
        "&": " and ",
    }

    for old, new in replacements.items():
        value = value.replace(old, new)

    value = re.sub(r"[^a-z0-9\s]", " ", value)

    return " ".join(value.split())


def text_similarity(first, second):
    """Return a similarity score between 0 and 1."""
    first = normalize_text(first)
    second = normalize_text(second)

    if not first or not second:
        return 0.0

    return SequenceMatcher(None, first, second).ratio()


def is_active(status):
    return (status or "").strip().lower() not in CLOSED_STATUSES


def compare_institutions(first, second):
    """
    Compare two institution records.

    Location is required as supporting evidence.
    Name similarity alone never creates an overlap.
    """

    name_score = text_similarity(first.name, second.name)

    same_state = (
        (first.state or "").strip().lower()
        == (second.state or "").strip().lower()
    )

    same_district = (
        (first.district or "").strip().lower()
        == (second.district or "").strip().lower()
    )

    same_pincode = (
        bool(first.pincode)
        and bool(second.pincode)
        and first.pincode.strip() == second.pincode.strip()
    )

    location_supported = (
        same_state and (same_district or same_pincode)
    )

    return {
        "name_score": name_score,
        "same_state": same_state,
        "same_district": same_district,
        "same_pincode": same_pincode,
        "location_supported": location_supported,
    }


def detect_overlaps(complaints):
    """
    Detect potential cross-bureau overlaps.

    Different institution records can be compared using
    institution name and location evidence.

    Results are suggestions only. No records are merged.
    """

    active_cases = [
        case for case in complaints
        if is_active(case.status)
    ]

    overlaps = []
    seen_pairs = set()

    for i in range(len(active_cases)):
        for j in range(i + 1, len(active_cases)):

            first = active_cases[i]
            second = active_cases[j]

            if first.case_number == second.case_number:
                continue

            first_bureau = (first.bureau or "").strip().lower()
            second_bureau = (second.bureau or "").strip().lower()

            if not first_bureau or not second_bureau:
                continue

            if first_bureau == second_bureau:
                continue

            first_institution = first.institution
            second_institution = second.institution

            if first_institution is None or second_institution is None:
                continue

            comparison = compare_institutions(
                first_institution,
                second_institution,
            )

            # Do not consider name similarity without location evidence.
            if not comparison["location_supported"]:
                continue

            name_score = comparison["name_score"]

            if name_score < 0.65:
                continue

            subject_score = text_similarity(
                first.subject,
                second.subject,
            )

            # Complaint similarity supports the explanation,
            # but does not independently establish institution identity.
            if name_score >= 0.90:
                confidence = "PROBABLE"
            else:
                confidence = "POSSIBLE"

            pair_key = tuple(sorted([
                first.case_number,
                second.case_number,
            ]))

            if pair_key in seen_pairs:
                continue

            seen_pairs.add(pair_key)

            signals = [
                f"Institution name similarity: {name_score:.0%}",
                "Both complaints are active.",
                "Complaints belong to different bureaus.",
            ]

            if comparison["same_district"]:
                signals.append("Institution district matches.")

            if comparison["same_pincode"]:
                signals.append("Institution PIN code matches.")

            if subject_score >= 0.60:
                signals.append(
                    f"Complaint subject similarity: {subject_score:.0%}"
                )

            overlaps.append({
                "case_1": first.case_number,
                "case_2": second.case_number,
                "institution_id_1": first.institution_id,
                "institution_id_2": second.institution_id,
                "institution_1": first_institution.name,
                "institution_2": second_institution.name,
                "bureau_1": first.bureau,
                "bureau_2": second.bureau,
                "confidence": confidence,
                "institution_similarity": round(name_score, 3),
                "subject_similarity": round(subject_score, 3),
                "signals": signals,
                "explanation": (
                    "These active complaints may involve the same "
                    "institution. Institution identity and location "
                    "signals support a possible cross-bureau overlap. "
                    "An officer must review the records before taking action."
                ),
                "requires_human_review": True,
            })

    return overlaps
