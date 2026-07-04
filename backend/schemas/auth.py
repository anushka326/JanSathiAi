from pydantic import BaseModel, Field, field_validator


class UserProfile(BaseModel):
    name: str | None = None
    age: int | None = None
    gender: str | None = None
    occupation: str | None = None
    income: int | None = None
    state: str | None = None
    disability_status: bool | None = None
    category: str | None = None
    student_status: bool | None = None
    farmer_status: bool | None = None
    employment_status: str | None = None
    has_pucca_house: bool | None = None
    rural_resident: bool | None = None
    has_bank_account: bool | None = None
    consent: bool | None = None


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=8, max_length=128)
    state: str = Field(min_length=2, max_length=80)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("full_name", "state")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return " ".join(value.strip().split())


class UserLogin(BaseModel):
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserPublic(BaseModel):
    id: str
    full_name: str
    email: str
    state: str
    profile: UserProfile | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
