import re
from typing import Any
from models.scheme import Scheme


class RecommendationEngine:
    def __init__(self, profile) -> None:
        self.profile = profile

    def score_scheme(self, scheme: Scheme) -> tuple[int, dict[str, bool]]:
        """
        Calculates a weighted match score out of 100 using the following dimensions:
        Occupation 30%, Category 20%, Income 15%, Age 10%, Gender 10%, State 10%, Special Flags 5%.
        """
        breakdown = {
            "occupation": False,
            "category": False,
            "income": False,
            "age": False,
            "gender": False,
            "state": False,
            "special_flags": False,
        }

        user_occ = (self.profile.occupation or "").lower()
        scheme_text = " ".join([
            scheme.scheme_name,
            scheme.summary,
            scheme.benefit,
            " ".join(scheme.eligibility),
            " ".join(scheme.keywords),
        ]).lower()
        scheme_name = scheme.scheme_name.lower()
        scheme_category = scheme.category.lower()

        occ_score = 0
        if self._occupation_matches(user_occ, scheme_text, scheme_category, scheme_name):
            occ_score = 30
            breakdown["occupation"] = True
        elif self.profile.farmer_status and scheme_category in {"farmer", "agriculture"}:
            occ_score = 20
            breakdown["occupation"] = True
        elif self.profile.student_status and any(token in scheme_text for token in ["student", "scholarship", "education", "skill", "internship"]):
            occ_score = 20
            breakdown["occupation"] = True
        elif self.profile.disability_status and any(token in scheme_text for token in ["disability", "divyang", "disabled"]):
            occ_score = 20
            breakdown["occupation"] = True
        elif self.profile.gender == "female" and any(token in scheme_text for token in ["woman", "women", "girl", "female", "welfare"]):
            occ_score = 20
            breakdown["occupation"] = True
        elif self.profile.age >= 60 and any(token in scheme_text for token in ["pension", "senior", "old age"]):
            occ_score = 20
            breakdown["occupation"] = True

        cat_score = 0
        if self._category_matches(scheme_text, scheme_category, self.profile.category.lower()):
            cat_score = 20
            breakdown["category"] = True
        elif self.profile.student_status and any(token in scheme_text for token in ["student", "scholarship", "education"]):
            cat_score = 20
            breakdown["category"] = True

        inc_score = 0
        if not scheme.income_limit or scheme.income_limit == 0:
            inc_score = 15
            breakdown["income"] = True
        elif self.profile.income <= scheme.income_limit:
            inc_score = 15
            breakdown["income"] = True

        age_score = 0
        if self._age_matches(scheme_name, self.profile.age):
            age_score = 10
            breakdown["age"] = True

        gender_score = 0
        if self._gender_matches(scheme_text, self.profile.gender):
            gender_score = 10
            breakdown["gender"] = True

        state_score = 0
        if scheme.state == "All India" or scheme.state.lower() == (self.profile.state or "").lower():
            state_score = 10
            breakdown["state"] = True

        special_score = 0
        if self._special_flag_matches(scheme_text, scheme_name, self.profile):
            special_score = 5
            breakdown["special_flags"] = True

        if self._health_priority(scheme_text, self.profile):
            special_score = max(special_score, 5)
            breakdown["special_flags"] = True

        if self.profile.student_status and not self.profile.farmer_status and any(token in scheme_text for token in ["farmer", "agriculture", "kisan", "crop"]):
            total_score = 15
        else:
            total_score = occ_score + cat_score + inc_score + age_score + gender_score + state_score + special_score
        total_score = max(0, min(100, total_score))

        return total_score, breakdown

    def _occupation_matches(self, user_occ: str, scheme_text: str, scheme_category: str, scheme_name: str) -> bool:
        if not user_occ:
            return False

        if any(token in user_occ for token in ["student", "education", "scholar"]):
            return any(token in scheme_text for token in ["student", "scholarship", "education", "skill", "internship", "loan"])

        if any(token in user_occ for token in ["farmer", "agricultur", "cultiv"]):
            return scheme_category in {"farmer", "agriculture"} or any(token in scheme_text for token in ["farmer", "agriculture", "kisan", "crop", "farmer"])

        if any(token in user_occ for token in ["worker", "labour", "employment", "job", "employee"]):
            return any(token in scheme_text for token in ["worker", "labour", "employment", "job", "skill", "welfare"])

        if any(token in user_occ for token in ["woman", "female", "girl"]):
            return any(token in scheme_text for token in ["woman", "women", "girl", "female", "welfare"])

        if any(token in user_occ for token in ["senior", "retired", "old", "pension"]):
            return any(token in scheme_text for token in ["pension", "senior", "old age"])

        if any(token in user_occ for token in ["disabled", "divyang"]):
            return any(token in scheme_text for token in ["disability", "divyang", "disabled"])

        return False

    def _category_matches(self, scheme_text: str, scheme_category: str, user_cat: str) -> bool:
        normalized = user_cat.lower()
        if normalized in {"general", "obc", "sc", "st", "ews"}:
            if normalized in scheme_text and normalized not in {"general"}:
                return True
            if normalized == "general" and not any(token in scheme_text for token in ["sc", "obc", "st", "scheduled caste", "backward class"]):
                return True
        return scheme_category.lower() in {"education", "farmer", "health", "housing", "business", "pension", "disability support", "women welfare", "labour"}

    def _age_matches(self, scheme_name: str, user_age: int) -> bool:
        lowered = scheme_name.lower()
        if "sukanya" in lowered:
            return user_age <= 10
        if "old age" in lowered or "senior" in lowered or "pension" in lowered:
            return user_age >= 60
        if "scholarship" in lowered or "student" in lowered:
            return user_age <= 25
        return True

    def _gender_matches(self, scheme_text: str, gender: str | None) -> bool:
        if not gender or gender == "prefer_not_to_say":
            return False
        if gender == "female":
            return any(token in scheme_text for token in ["woman", "women", "girl", "female", "welfare"])
        return True

    def _special_flag_matches(self, scheme_text: str, scheme_name: str, profile) -> bool:
        if profile.student_status and any(token in scheme_text for token in ["student", "scholarship", "education"]):
            return True
        if profile.farmer_status and any(token in scheme_text for token in ["farmer", "agriculture", "kisan", "crop"]):
            return True
        if profile.disability_status and any(token in scheme_text for token in ["disability", "divyang", "disabled"]):
            return True
        if profile.age >= 60 and any(token in scheme_text for token in ["pension", "senior", "old age"]):
            return True
        if profile.gender == "female" and any(token in scheme_text for token in ["women", "girl", "woman", "female", "welfare"]):
            return True
        return False

    def _health_priority(self, scheme_text: str, profile) -> bool:
        if not profile.income:
            return False
        if profile.income <= 200000 and any(token in scheme_text for token in ["health", "hospital", "insurance", "cashless", "medical"]):
            return True
        return False
