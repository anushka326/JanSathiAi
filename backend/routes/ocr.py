import logging
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from typing import Any

from services.ocr_service import OCRService
from services.database import mongo_manager
from utils.security import mask_aadhaar, mask_pan, EncryptionService
from routes.eligibility import get_optional_user

logger = logging.getLogger("jansathi.ocr_route")
router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    consent: bool = Form(...),
    user: dict | None = Depends(get_optional_user)
) -> dict[str, Any]:
    """
    Endpoint to upload a citizen ID document, run OCR, mask sensitive PII,
    and return structured JSON to auto-fill the eligibility profile.
    """
    if not consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Citizen consent is required to process document uploads."
        )

    # Validate mime types
    allowed_types = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file.content_type}. Only images and PDFs are allowed."
        )

    try:
        # Read file bytes in memory (memory buffer)
        file_bytes = await file.read()
        
        # Invoke OCR service
        ocr_service = OCRService()
        raw_result = await ocr_service.extract_document_fields(file_bytes, file.content_type)
        
        # Instantiate encryption
        crypt = EncryptionService()
        
        # Extract and mask PII
        raw_aadhaar = str(raw_result.get("aadhaar_number") or raw_result.get("aadhaar") or "")
        raw_pan = str(raw_result.get("pan_number") or raw_result.get("pan") or "")
        
        masked_aadhaar = mask_aadhaar(raw_aadhaar) if raw_aadhaar else None
        masked_pan = mask_pan(raw_pan) if raw_pan else None
        
        encrypted_aadhaar = crypt.encrypt(raw_aadhaar) if raw_aadhaar else None
        encrypted_pan = crypt.encrypt(raw_pan) if raw_pan else None
        
        # Build structured response
        structured_data = {
            "name": raw_result.get("name"),
            "age": raw_result.get("age"),
            "gender": raw_result.get("gender"),
            "occupation": raw_result.get("occupation"),
            "income": raw_result.get("income"),
            "state": raw_result.get("state"),  # Searchable, do not encrypt
            "category": raw_result.get("category"),
            "disability_status": raw_result.get("disability_status") or raw_result.get("disability") or False,
            "masked_aadhaar": masked_aadhaar,
            "masked_pan": masked_pan,
            "encrypted_aadhaar": encrypted_aadhaar,
            "encrypted_pan": encrypted_pan,
            "confidence_score": raw_result.get("confidence_score", 1.0),
        }
        
        # Audit logging
        user_id = user["sub"] if user else None
        await mongo_manager.save_audit_log(
            user_id=user_id,
            action="DOCUMENT_OCR_PROCESS",
            details={
                "file_name": file.filename,
                "mime_type": file.content_type,
                "confidence_score": structured_data["confidence_score"],
                "state": structured_data["state"],
                "masked_aadhaar": masked_aadhaar,
            }
        )
        
        # Memory cleanup: delete reference to bytes buffer
        del file_bytes
        
        return {
            "status": "success",
            "data": structured_data
        }
        
    except Exception as e:
        logger.error("Failed processing document: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )
