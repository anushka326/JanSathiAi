import base64
import hashlib
import re
from cryptography.fernet import Fernet, InvalidToken

from config import get_settings


def mask_aadhaar(value: str) -> str:
    """Masks Aadhaar number keeping only the last 4 digits (e.g. XXXX-XXXX-9012)"""
    digits = re.sub(r"\D", "", value)
    if len(digits) != 12:
        return value
    return f"XXXX-XXXX-{digits[-4:]}"


def mask_pan(value: str) -> str:
    """Masks PAN number keeping only the last 4 digits (e.g. XXXXX1234X)"""
    clean = re.sub(r"\s", "", value).upper()
    if len(clean) != 10:
        return value
    return f"XXXXX{clean[5:9]}X"


class EncryptionService:
    def __init__(self) -> None:
        settings = get_settings()
        key = settings.fernet_key
        if not key:
            # Generate a deterministic 32-byte key from the application's secret key
            hashed = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
            key = base64.urlsafe_b64encode(hashed).decode("utf-8")
        self._fernet = Fernet(key.encode("utf-8"))

    @property
    def enabled(self) -> bool:
        return True

    def encrypt(self, value: str) -> str:
        return self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def decrypt(self, value: str) -> str:
        try:
            return self._fernet.decrypt(value.encode("utf-8")).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError("Encrypted value could not be decrypted") from exc

