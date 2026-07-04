import base64
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException, status

from ..config import get_settings
from ..schemas.auth import UserCreate, UserLogin, UserProfile, UserPublic
from ..services.database import mongo_manager

_demo_users: dict[str, dict[str, Any]] = {}


def _b64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")


def _b64url_decode(payload: str) -> bytes:
    padding = "=" * (-len(payload) % 4)
    return base64.urlsafe_b64decode(payload + padding)


def _hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_urlsafe(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 210_000)
    return f"pbkdf2_sha256${salt}${base64.b64encode(digest).decode('ascii')}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt, digest = stored_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    return hmac.compare_digest(_hash_password(password, salt), stored_hash)


_demo_users["admin@jansathi.gov.in"] = {
    "_id": "admin_demo_id",
    "full_name": "Admin Officer",
    "email": "admin@jansathi.gov.in",
    "state": "Delhi",
    "password_hash": _hash_password("admin123", salt="demosaltadmin"),
    "preferred_language": "en",
    "created_at": datetime.now(UTC),
}
_demo_users["citizen@jansathi.gov.in"] = {
    "_id": "citizen_demo_id",
    "full_name": "Aarav Sharma",
    "email": "citizen@jansathi.gov.in",
    "state": "Maharashtra",
    "password_hash": _hash_password("citizen123", salt="demosaltcitizen"),
    "preferred_language": "en",
    "created_at": datetime.now(UTC),
}


async def seed_demo_users() -> None:
    if not mongo_manager.is_connected:
        return
    for email, info in _demo_users.items():
        existing = await mongo_manager.db.users.find_one({"email": email})
        if not existing:
            user_doc = dict(info)
            await mongo_manager.db.users.insert_one(user_doc)
            await mongo_manager.save_audit_log(
                user_id=info["_id"],
                action="SEED_DEMO_USER",
                details={"email": email}
            )



def create_access_token(user: UserPublic) -> str:
    settings = get_settings()
    header = {"alg": "HS256", "typ": "JWT"}
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.full_name,
        "state": user.state,
        "preferred_language": user.preferred_language,
        "exp": int(expires_at.timestamp()),
    }
    header_segment = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_segment = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    signature = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{header_segment}.{payload_segment}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        header_segment, payload_segment, signature_segment = token.split(".", 2)
        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
        expected = hmac.new(settings.secret_key.encode("utf-8"), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_encode(expected), signature_segment):
            raise ValueError("Invalid token signature")
        payload = json.loads(_b64url_decode(payload_segment))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

    if int(payload.get("exp", 0)) < int(datetime.now(UTC).timestamp()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token has expired")
    return payload


async def _find_user_by_email(email: str) -> dict[str, Any] | None:
    if mongo_manager.is_connected:
        return await mongo_manager.db.users.find_one({"email": email})
    return _demo_users.get(email)


async def _store_user(user: dict[str, Any]) -> dict[str, Any]:
    if mongo_manager.is_connected:
        result = await mongo_manager.db.users.insert_one(user)
        user["_id"] = str(result.inserted_id)
        return user
    user["_id"] = user["email"]
    _demo_users[user["email"]] = user
    return user


def _public_user(user: dict[str, Any]) -> UserPublic:
    profile = user.get("profile")
    return UserPublic(
        id=str(user.get("_id", user["email"])),
        full_name=user["full_name"],
        email=user["email"],
        state=user["state"],
        preferred_language=user.get("preferred_language", "en"),
        profile=UserProfile(**profile) if isinstance(profile, dict) else None,
    )


async def register_user(payload: UserCreate) -> UserPublic:
    existing = await _find_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")

    user = {
        "full_name": payload.full_name,
        "email": payload.email,
        "state": payload.state,
        "password_hash": _hash_password(payload.password),
        "preferred_language": payload.preferred_language,
        "profile": {},
        "created_at": datetime.now(UTC),
    }
    stored = await _store_user(user)
    user_public = _public_user(stored)
    
    # Save Audit Log
    await mongo_manager.save_audit_log(
        user_id=user_public.id,
        action="USER_REGISTER",
        details={"email": user_public.email, "state": user_public.state}
    )
    
    return user_public


async def authenticate_user(payload: UserLogin) -> UserPublic:
    user = await _find_user_by_email(payload.email)
    if not user or not _verify_password(payload.password, user["password_hash"]):
        # Log failed login attempt
        await mongo_manager.save_audit_log(
            user_id=None,
            action="USER_LOGIN_FAILED",
            details={"email": payload.email}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    user_public = _public_user(user)
    
    # Log successful login
    await mongo_manager.save_audit_log(
        user_id=user_public.id,
        action="USER_LOGIN",
        details={"email": user_public.email}
    )
    
    return user_public


async def update_user_language(email: str, preferred_language: str) -> UserPublic:
    user = await _find_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user["preferred_language"] = preferred_language
    if mongo_manager.is_connected:
        await mongo_manager.db.users.update_one(
            {"email": email},
            {"$set": {"preferred_language": preferred_language}},
        )
    else:
        _demo_users[email] = user

    return _public_user(user)
