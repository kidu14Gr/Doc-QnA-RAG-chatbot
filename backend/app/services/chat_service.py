"""
Chat history persistence: load last N messages for context, save user + assistant after each turn.
"""
from uuid import UUID

from sqlalchemy.orm import Session

from ..models import ChatHistory

HISTORY_LIMIT = 20


def get_recent_history(db: Session, user_id: UUID, limit: int = HISTORY_LIMIT) -> str:
    """Return last N messages formatted as 'Human: ...\\nAI: ...' for prompt context."""
    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
    rows = list(reversed(rows))
    lines = []
    for r in rows:
        if r.role == "user":
            lines.append(f"Human: {r.message}")
        else:
            lines.append(f"AI: {r.message}")
    return "\n".join(lines) if lines else ""


def save_turn(
    db: Session,
    user_id: UUID,
    user_message: str,
    assistant_message: str,
) -> None:
    """Persist one user message and one assistant message."""
    db.add(ChatHistory(user_id=user_id, role="user", message=user_message))
    db.add(ChatHistory(user_id=user_id, role="assistant", message=assistant_message))
    db.commit()
