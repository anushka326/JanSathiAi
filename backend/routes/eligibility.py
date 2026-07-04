from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas.eligibility import EligibilityRequest, EligibilityResponse
from services.database import mongo_manager
from services.eligibility_engine import EligibilityEngine
from services.scheme_repository import SchemeRepository, get_scheme_repository
from services.auth_service import decode_access_token

router = APIRouter(prefix="/eligibility", tags=["eligibility"])
optional_bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(optional_bearer_scheme)) -> dict | None:
    if not credentials:
        return None
    try:
        return decode_access_token(credentials.credentials)
    except Exception:
        return None


@router.post("/check", response_model=EligibilityResponse)
async def check_eligibility(
    payload: EligibilityRequest,
    repository: SchemeRepository = Depends(get_scheme_repository),
    user: dict | None = Depends(get_optional_user)
) -> EligibilityResponse:
    if not payload.consent:
        raise HTTPException(
            status_code=400,
            detail="Citizen consent is required to evaluate scheme eligibility."
        )
        
    engine = EligibilityEngine(repository.list_schemes())
    response = engine.evaluate(payload)
    
    user_id = user["sub"] if user else None
    if user_id:
        await mongo_manager.save_user_profile(user_id, payload.model_dump())

    await mongo_manager.save_eligibility_history(
        {
            "user_id": user_id,
            "profile": payload.model_dump(),
            "eligible_scheme_names": [item.scheme.scheme_name for item in response.eligible_schemes],
            "ineligible_scheme_names": [item.scheme.scheme_name for item in response.ineligible_schemes],
        }
    )
    
    await mongo_manager.save_audit_log(
        user_id=user_id,
        action="ELIGIBILITY_CHECK",
        details={
            "state": payload.state,
            "eligible_count": len(response.eligible_schemes),
            "ineligible_count": len(response.ineligible_schemes),
        }
    )
    return response


@router.get("/history", response_model=list)
async def get_history(user: dict | None = Depends(get_optional_user)):
    user_id = user["sub"] if user else None
    return await mongo_manager.get_eligibility_history(user_id)

