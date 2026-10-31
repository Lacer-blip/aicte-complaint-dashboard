
import re
from difflib import SequenceMatcher


def normalize_name(name: str) -> str:
    """Normalize institution names for comparison."""

    name = (name or "").lower().strip()

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
        name = name.replace(old, new)

    name = re.sub(r"[^a-z0-9\s]", " ", name)

    return " ".join(name.split())


def similarity(first: str, second: str) -> float:
    """Return name similarity between 0 and 1."""

    return SequenceMatcher(
        None,
        normalize_name(first),
        normalize_name(second)
    ).ratio()


def resolve_institution(
    name,
    district,
    state,
    pincode,
    candidates,
    permanent_id=None
):
    """
    Resolve an institution against existing records.

    Returns a decision and confidence level.
    Never modifies or merges institution records.
    """

    if not name or not name.strip():
        return {
            "decision": "INVALID",
            "confidence": "NONE",
            "matched_institution_id": None,
            "score": 0,
            "reason": "Institution name is missing."
        }

    # 1. Exact Permanent ID match
    if permanent_id:
        for institution in candidates:
            if (
                institution.permanent_id
                and institution.permanent_id.strip().lower()
                == permanent_id.strip().lower()
            ):
                return {
                    "decision": "MATCHED_EXACT",
                    "confidence": "CONFIRMED",
                    "matched_institution_id": institution.id,
                    "score": 1.0,
                    "reason": "Exact Permanent ID match."
                }

    normalized_name = normalize_name(name)

    # 2. Exact normalized name + location match
    for institution in candidates:
        same_name = (
            normalize_name(institution.name) == normalized_name
        )

        same_district = (
            (institution.district or "").strip().lower()
            == (district or "").strip().lower()
        )

        same_state = (
            (institution.state or "").strip().lower()
            == (state or "").strip().lower()
        )

        same_pincode = (
            (institution.pincode or "").strip()
            == (pincode or "").strip()
        )

        if same_name and same_district and same_state and same_pincode:
            return {
                "decision": "MATCHED_EXACT",
                "confidence": "CONFIRMED",
                "matched_institution_id": institution.id,
                "score": 1.0,
                "reason": "Exact normalized name and location match."
            }

    # 3. Conservative fuzzy matching
    possible_matches = []

    for institution in candidates:

        same_state = (
            (institution.state or "").strip().lower()
            == (state or "").strip().lower()
        )

        same_district = (
            (institution.district or "").strip().lower()
            == (district or "").strip().lower()
        )

        same_pincode = (
            (institution.pincode or "").strip()
            == (pincode or "").strip()
        )

        # Require location evidence before considering a fuzzy match.
        if not same_state or not (same_district or same_pincode):
            continue

        score = similarity(name, institution.name)

        possible_matches.append({
            "institution": institution,
            "score": score
        })

    possible_matches.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    if possible_matches:
        best = possible_matches[0]
        second_score = (
            possible_matches[1]["score"]
            if len(possible_matches) > 1
            else 0
        )

        margin = best["score"] - second_score

        if best["score"] >= 0.90 and margin >= 0.08:
            return {
                "decision": "REVIEW_REQUIRED",
                "confidence": "PROBABLE",
                "matched_institution_id": best["institution"].id,
                "score": round(best["score"], 3),
                "reason": (
                    "Strong name similarity with supporting "
                    "location evidence. Human confirmation required."
                )
            }

        if best["score"] >= 0.70:
            return {
                "decision": "REVIEW_REQUIRED",
                "confidence": "POSSIBLE",
                "matched_institution_id": best["institution"].id,
                "score": round(best["score"], 3),
                "reason": (
                    "Possible name similarity. Manual verification "
                    "is required."
                )
            }

    # 4. No reliable match
    return {
        "decision": "NEW_OR_REVIEW",
        "confidence": "NONE",
        "matched_institution_id": None,
        "score": 0,
        "reason": "No sufficiently reliable institution match found."
    }
