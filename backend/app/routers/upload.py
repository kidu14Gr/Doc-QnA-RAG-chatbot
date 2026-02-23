"""
Upload routes: PDF and DOCX. Protected; store file in user's folder and ingest to user's vector store.
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import User, Document
from ..schemas import UploadResponse
from ..services.rag_service import RAGService
from ..services.storage_service import safe_save_upload

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])
rag_service = RAGService()


def _check_pdf(filename: str) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed",
        )


def _check_docx(filename: str) -> None:
    if not filename or not filename.lower().endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DOCX files are allowed",
        )


@router.post("/pdf", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_pdf(file.filename or "")
    content = await file.read()
    path = safe_save_upload(current_user.id, file.filename or "document.pdf", content)
    try:
        rag_service.ingest_pdf(current_user.id, str(path))
    except Exception as e:
        logger.exception("Ingest PDF failed for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document processing failed",
        ) from e
    doc = Document(user_id=current_user.id, filename=file.filename or "document.pdf")
    db.add(doc)
    db.commit()
    return UploadResponse(message=f"{file.filename} ingested successfully!")


@router.post("/docx", response_model=UploadResponse)
async def upload_docx(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_docx(file.filename or "")
    content = await file.read()
    path = safe_save_upload(current_user.id, file.filename or "document.docx", content)
    try:
        rag_service.ingest_docx(current_user.id, str(path))
    except Exception as e:
        logger.exception("Ingest DOCX failed for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document processing failed",
        ) from e
    doc = Document(user_id=current_user.id, filename=file.filename or "document.docx")
    db.add(doc)
    db.commit()
    return UploadResponse(message=f"{file.filename} ingested successfully!")
