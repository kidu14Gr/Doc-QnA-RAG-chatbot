"""
Public general chat (no auth, no RAG). For general questions only.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.rag_service import _get_llm
from rag_core.generation.prompt_templates import build_general_prompt

router = APIRouter(prefix="/chat", tags=["chat"])


class GeneralChatBody(BaseModel):
    question: str = Field(..., min_length=1, max_length=10000)


class GeneralChatResponse(BaseModel):
    answer: str


@router.post("/general", response_model=GeneralChatResponse)
def general_chat(body: GeneralChatBody):
    """Public endpoint: general Q&A without document context or auth."""
    llm = _get_llm()
    prompt = build_general_prompt(body.question, "")
    answer = llm.generate_general(prompt)
    return GeneralChatResponse(answer=answer)
