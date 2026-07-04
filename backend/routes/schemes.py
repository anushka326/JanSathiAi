from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from models.scheme import Scheme
from services.database import mongo_manager
from services.gemini_service import GeminiService
from services.rag_service import RAGService
from services.scheme_repository import SchemeRepository, get_scheme_repository
from services.auth_service import decode_access_token

router = APIRouter(prefix="/schemes", tags=["schemes"])
bearer_scheme = HTTPBearer(auto_error=True)
optional_bearer_scheme = HTTPBearer(auto_error=False)


class SchemeSaveRequest(BaseModel):
    scheme_name: str


class ExplainRequest(BaseModel):
    scheme_name: str
    language: str = "en"


class ExplainResponse(BaseModel):
    explanation: str


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    try:
        return decode_access_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        ) from exc


@router.get("", response_model=list[Scheme])
async def list_schemes(repository: SchemeRepository = Depends(get_scheme_repository)) -> list[Scheme]:
    return repository.list_schemes()


@router.post("/save", status_code=200)
async def save_scheme(
    payload: SchemeSaveRequest,
    user: dict = Depends(get_current_user)
):
    user_id = user["sub"]
    await mongo_manager.save_scheme(user_id, payload.scheme_name)
    return {"status": "success", "message": f"Scheme '{payload.scheme_name}' saved."}


@router.post("/unsave", status_code=200)
async def unsave_scheme(
    payload: SchemeSaveRequest,
    user: dict = Depends(get_current_user)
):
    user_id = user["sub"]
    await mongo_manager.unsave_scheme(user_id, payload.scheme_name)
    return {"status": "success", "message": f"Scheme '{payload.scheme_name}' removed."}


@router.get("/saved", response_model=list[str])
async def get_saved_schemes(
    user: dict = Depends(get_current_user)
):
    user_id = user["sub"]
    return await mongo_manager.get_saved_schemes(user_id)


@router.post("/explain", response_model=ExplainResponse)
async def explain_scheme(
    payload: ExplainRequest,
    repository: SchemeRepository = Depends(get_scheme_repository)
):
    scheme = repository.get_by_name(payload.scheme_name)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{payload.scheme_name}' not found."
        )

    rag = RAGService()
    gemini = GeminiService()

    # Search for specific scheme context using RAG
    context = rag.search(payload.scheme_name)
    
    # Generate natural language explanation grounded on context
    question = f"Explain the government scheme called: {payload.scheme_name}"
    explanation = await gemini.answer_with_context(question, context, payload.language)

    return ExplainResponse(explanation=explanation)

