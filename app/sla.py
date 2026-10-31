from datetime import datetime, timedelta, timezone


CLOSED_STATUSES = {
    "closed",
    "resolved",
    "disposed",
    "rejected",
}

DUE_SOON_HOURS = 48


def get_sla_status(complaint, now=None):
    """
    Classify a complaint using its due_at date.

    Returns: CLOSED, NO_DEADLINE, OVERDUE, DUE_SOON, ON_TRACK
    """

    status = (complaint.status or "").strip().lower()

    if status in CLOSED_STATUSES:
        return "CLOSED"

    if complaint.due_at is None:
        return "NO_DEADLINE"

    if now is None:
        now = datetime.now()

    due_at = complaint.due_at

    # SQLite may return naive datetimes. Normalize aware values
    # to naive UTC for safe comparison.
    if due_at.tzinfo is not None:
        due_at = due_at.astimezone(timezone.utc).replace(tzinfo=None)

    if now.tzinfo is not None:
        now = now.astimezone(timezone.utc).replace(tzinfo=None)

    if due_at <= now:
        return "OVERDUE"

    if due_at <= now + timedelta(hours=DUE_SOON_HOURS):
        return "DUE_SOON"

    return "ON_TRACK"


def calculate_metrics(actual_pairs, predicted_pairs):
    """
    Calculate precision, recall and F1 for overlap detection.

    Each pair should contain two case identifiers.
    Pair order does not matter.
    """

    actual = {
        frozenset(pair)
        for pair in actual_pairs
        if len(pair) == 2
    }

    predicted = {
        frozenset(pair)
        for pair in predicted_pairs
        if len(pair) == 2
    }

    true_positives = len(actual & predicted)
    false_positives = len(predicted - actual)
    false_negatives = len(actual - predicted)

    precision = (
        true_positives / (true_positives + false_positives)
        if true_positives + false_positives
        else 0.0
    )

    recall = (
        true_positives / (true_positives + false_negatives)
        if true_positives + false_negatives
        else 0.0
    )

    f1 = (
        2 * precision * recall / (precision + recall)
        if precision + recall
        else 0.0
    )

    return {
        "true_positives": true_positives,
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1_score": round(f1, 3),
    }