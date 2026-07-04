from typing import Literal

from pydantic import BaseModel, Field, field_validator

from models.scheme import Scheme


Gender = Literal["female", "male", "other", "prefer_not_to_say"]
Category = Literal["General", "OBC", "SC", "ST", "EWS"]
EmploymentStatus = Literal["employed", "self_employed", "unemployed", "student", "retired"]


class EligibilityRequest(BaseModel):
    name: str = Field(default="Anonymous Citizen", min_length=2, max_length=100)
    consent: bool = Field(default=False)
    age: int = Field(ge=0, le=120)
    gender: Gender
    occupation: str = Field(min_length=2, max_length=80)
    income: int = Field(ge=0, le=100000000)
    state: str = Field(min_length=2, max_length=80)
    disability_status: bool = False
    category: Category = "General"
    student_status: bool = False
    farmer_status: bool = False
    employment_status: EmploymentStatus
    has_pucca_house: bool = False
    rural_resident: bool = False
    has_bank_account: bool = True

    @field_validator("occupation", "state")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        return " ".join(value.strip().split())


class SchemeDecision(BaseModel):
    scheme: Scheme
    reasons: list[str]
    score: int = 0
    match_percentage: float = 0.0
    breakdown: dict[str, bool] = Field(default_factory=dict)
    eligibility_status: str = "not_eligible"


class EligibilityResponse(BaseModel):
    eligible_schemes: list[SchemeDecision]
    ineligible_schemes: list[SchemeDecision]
    profile_summary: dict[str, str | int | bool]
