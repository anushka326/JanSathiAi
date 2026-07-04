from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..schemas.auth import AuthResponse, LanguageUpdate, UserCreate, UserLogin, UserPublic
from ..services.auth_service import (
    _find_user_by_email,
    _public_user,
    authenticate_user,
    create_access_token,
    decode_access_token,
    register_user,
    update_user_language,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=True)


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: UserCreate) -> AuthResponse:
    user = await register_user(payload)
    return AuthResponse(access_token=create_access_token(user), user=user)


@router.post("/login", response_model=AuthResponse)
async def login(payload: UserLogin) -> AuthResponse:
    user = await authenticate_user(payload)
    return AuthResponse(access_token=create_access_token(user), user=user)


@router.get("/me", response_model=UserPublic)
async def me(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> UserPublic:
    payload = decode_access_token(credentials.credentials)
    user = await _find_user_by_email(str(payload["email"]))
    if user is None:
        return UserPublic(
            id=str(payload["sub"]),
            full_name=str(payload["name"]),
            email=str(payload["email"]),
            state=str(payload["state"]),
            preferred_language=str(payload.get("preferred_language", "en")),
        )

    return _public_user(user)


@router.put("/language", response_model=UserPublic)
async def update_language(
    payload: LanguageUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> UserPublic:
    token_payload = decode_access_token(credentials.credentials)
    return await update_user_language(str(token_payload["email"]), payload.preferred_language)
