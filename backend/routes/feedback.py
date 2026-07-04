from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from services.database import mongo_manager

router = APIRouter(prefix="/feedback", tags=["feedback"])


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=1000)
    user_name: str | None = "Anonymous Citizen"
    scheme_name: str | None = None


class FeedbackResponse(BaseModel):
    id: str
    rating: int
    comment: str
    user_name: str
    scheme_name: str | None
    created_at: str


@router.post("", response_model=dict, status_code=201)
async def submit_feedback(payload: FeedbackCreate):
    try:
        inserted_id = await mongo_manager.save_feedback(payload.model_dump())
        return {"status": "success", "id": inserted_id, "message": "Feedback submitted successfully."}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(exc)}"
        )


@router.get("", response_model=list[FeedbackResponse])
async def list_feedback():
    try:
        results = await mongo_manager.get_feedback()
        return [
            FeedbackResponse(
                id=doc["_id"],
                rating=doc["rating"],
                comment=doc["comment"],
                user_name=doc.get("user_name") or "Anonymous Citizen",
                scheme_name=doc.get("scheme_name"),
                created_at=doc["created_at"]
            )
            for doc in results
        ]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve feedback: {str(exc)}"
        )
