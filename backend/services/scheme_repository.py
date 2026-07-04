import json
from functools import lru_cache
from pathlib import Path

from config import get_settings
from models.scheme import Scheme


class SchemeRepository:
    def __init__(self, data_path: Path | None = None) -> None:
        self.data_path = data_path or get_settings().resolved_schemes_path

    def list_schemes(self) -> list[Scheme]:
        with self.data_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)
        return [Scheme.model_validate(item) for item in payload]

    def save_schemes(self, schemes: list[Scheme]) -> None:
        payload = [scheme.model_dump(mode="json") for scheme in schemes]
        with self.data_path.open("w", encoding="utf-8") as file:
            json.dump(payload, file, indent=2, ensure_ascii=False)

    def get_by_name(self, scheme_name: str) -> Scheme | None:
        normalized = scheme_name.casefold()
        return next((scheme for scheme in self.list_schemes() if scheme.scheme_name.casefold() == normalized), None)



@lru_cache
def get_scheme_repository() -> SchemeRepository:
    return SchemeRepository()
