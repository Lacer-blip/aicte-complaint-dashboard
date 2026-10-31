import re


CLOSED_STATUSES = {
    "closed",
    "resolved",
    "disposed",
    "rejected",
}


def normalize_bureau(bureau):
    """Normalize bureau names for comparison."""
    return re.sub(r"\s+", " ", (bureau or "").strip().lower())


def is_active(status):
    """Return False for complaints with a closed status."""
    return (status or "").strip().lower() not in CLOSED_STATUSES


def detect_overlaps(complaints):
    """
    Detect active complaints linked to the same institution
    but handled by different bureaus.

    Suggestions only: no automatic merging or reassignment.
    """

    grouped = {}

    for complaint in complaints:
        if not is_active(complaint.status):
            continue

        grouped.setdefault(
            complaint.institution_id, []
        ).append(complaint)

    overlaps = []

    for institution_id, cases in grouped.items():

        for i in range(len(cases)):
            for j in range(i + 1, len(cases)):

                first = cases[i]
                second = cases[j]

                if normalize_bureau(first.bureau) == normalize_bureau(
                    second.bureau
                ):
                    continue

                overlaps.append({
                    "institution_id": institution_id,
                    "case_1": first.case_number,
                    "case_2": second.case_number,
                    "bureau_1": first.bureau,
                    "bureau_2": second.bureau,
                    "confidence": "CONFIRMED",
                    "signals": [
                        "Both complaints reference the same institution record.",
                        "Both complaints have active statuses.",
                        "The complaints are handled by different bureaus.",
                    ],
                    "explanation": (
                        "These active complaints reference the same "
                        "institution and are handled by different bureaus. "
                        "Review their subjects and histories to determine "
                        "whether coordination is needed."
                    ),
                    "requires_human_review": True,
                })

    return overlaps