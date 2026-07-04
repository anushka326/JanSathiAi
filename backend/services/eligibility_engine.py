from collections.abc import Callable

from models.scheme import Scheme
from schemas.eligibility import EligibilityRequest, EligibilityResponse, SchemeDecision
from services.recommendation_engine import RecommendationEngine


ProfileRule = Callable[[EligibilityRequest], tuple[bool, list[str]]]


class EligibilityEngine:
    def __init__(self, schemes: list[Scheme]) -> None:
        self.schemes = schemes
        self.rules = self._build_rules()

    def evaluate(self, profile: EligibilityRequest) -> EligibilityResponse:
        eligible: list[SchemeDecision] = []
        ineligible: list[SchemeDecision] = []
        rec_engine = RecommendationEngine(profile)

        for scheme in self.schemes:
            rule = self.rules.get(scheme.scheme_name, self._generic_rule(scheme))
            is_eligible, reasons = rule(profile)
            score, breakdown = rec_engine.score_scheme(scheme)
            decision = SchemeDecision(
                scheme=scheme,
                reasons=reasons,
                score=score,
                match_percentage=float(score),
                breakdown=breakdown,
                eligibility_status=self._classify_status(is_eligible, score),
            )
            if decision.eligibility_status in {"highly_eligible", "eligible"}:
                eligible.append(decision)
            else:
                ineligible.append(decision)

        eligible.sort(key=lambda item: (-item.match_percentage, item.scheme.category, item.scheme.scheme_name))
        ineligible.sort(key=lambda item: (-item.match_percentage, item.scheme.scheme_name))

        return EligibilityResponse(
            eligible_schemes=eligible,
            ineligible_schemes=ineligible,
            profile_summary={
                "age": profile.age,
                "gender": profile.gender,
                "occupation": profile.occupation,
                "income": profile.income,
                "state": profile.state,
                "category": profile.category,
                "student_status": profile.student_status,
                "farmer_status": profile.farmer_status,
                "employment_status": profile.employment_status,
                "disability_status": profile.disability_status,
            },
        )

    def _classify_status(self, is_eligible: bool, score: int) -> str:
        if not is_eligible:
            return "not_eligible"
        if score >= 80:
            return "highly_eligible"
        if score >= 50:
            return "eligible"
        return "partially_eligible"

    def _build_rules(self) -> dict[str, ProfileRule]:
        return {
            "PM Kisan Samman Nidhi": self._pm_kisan,
            "Ayushman Bharat PM-JAY": self._ayushman,
            "Pradhan Mantri Awas Yojana - Urban": self._pmay_urban,
            "Pradhan Mantri Awas Yojana - Gramin": self._pmay_gramin,
            "National Scholarship Portal - Pre-Matric Scholarship for SC Students": self._sc_student,
            "National Scholarship Portal - Post-Matric Scholarship for SC Students": self._sc_student,
            "National Scholarship Portal - Post-Matric Scholarship for OBC Students": self._obc_student,
            "National Scholarship Portal - Scholarships for Students with Disabilities": self._disabled_student,
            "Pradhan Mantri Kaushal Vikas Yojana": self._skill_training,
            "Pradhan Mantri MUDRA Yojana": self._micro_business,
            "Sukanya Samriddhi Yojana": self._sukanya,
            "Atal Pension Yojana": self._atal_pension,
            "PM Vishwakarma": self._vishwakarma,
            "Startup India Seed Fund Scheme": self._startup,
            "Pradhan Mantri Gramin Digital Saksharta Abhiyan": self._pmgdisha,
            "Stand-Up India": self._standup_india,
            "Prime Minister's Employment Generation Programme": self._pmegp,
            "Pradhan Mantri Ujjwala Yojana": self._ujjwala,
            "Pradhan Mantri Jan Dhan Yojana": self._jan_dhan,
            "National Social Assistance Programme - Indira Gandhi National Old Age Pension Scheme": self._old_age_pension,
            "Mahatma Jyotirao Phule Jan Arogya Yojana": self._mjp_jay,
            "Maharashtra Lek Ladki Yojana": self._lek_ladki,
            "Maharashtra Government Scholarship for Economically Backward Class Students": self._maha_ebc_scholarship,
            "Maharashtra Sanjay Gandhi Niradhar Anudan Yojana": self._sanjay_gandhi,
            "Mukhyamantri Majhi Ladki Bahin Yojana": self._majhi_ladki_bahin,
            "Namo Shetkari Mahasaman Yojana": self._namo_shetkari,
            "Ramai Awas Yojana": self._ramai_awaas,
        }

    def _generic_rule(self, scheme: Scheme) -> ProfileRule:
        def rule(profile: EligibilityRequest) -> tuple[bool, list[str]]:
            reasons: list[str] = []
            if scheme.state != "All India" and profile.state.casefold() != scheme.state.casefold():
                return False, [f"Scheme is for {scheme.state} residents."]
            if scheme.income_limit and profile.income > scheme.income_limit:
                return False, [f"Income exceeds the scheme limit of Rs. {scheme.income_limit}."]
            reasons.append("Profile matches the general state and income criteria.")
            return True, reasons

        return rule

    def _state_allowed(self, profile: EligibilityRequest, state: str) -> bool:
        return state == "All India" or profile.state.casefold() == state.casefold()

    def _occupation_has(self, profile: EligibilityRequest, *tokens: str) -> bool:
        text = profile.occupation.casefold()
        return any(token in text for token in tokens)

    def _pm_kisan(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.farmer_status or self._occupation_has(profile, "farmer", "agriculture", "cultivator"):
            return True, ["Applicant is marked as a farmer or has agriculture-related occupation."]
        return False, ["PM Kisan is intended for eligible landholding farmer families."]

    def _ayushman(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.age >= 70:
            return True, ["Senior citizens aged 70 or above are treated as potentially eligible."]
        if profile.income <= 200000:
            return True, ["Household income is within the MVP threshold for economically vulnerable families."]
        if profile.farmer_status and profile.state.casefold() == "maharashtra":
            return True, ["Farmer profile in Maharashtra is treated as potentially eligible for health support."]
        if profile.occupation.casefold() in {"farmer", "agriculture", "cultivator"} and profile.state.casefold() == "maharashtra":
            return True, ["Agriculture occupation in Maharashtra aligns with the health-support coverage pathway."]
        return False, ["Income is above the MVP threshold and applicant is below 70 years."]

    def _pmay_urban(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.has_pucca_house:
            return False, ["Applicant already has a pucca house."]
        if profile.rural_resident:
            return False, ["Urban PMAY is for urban residents; rural residents should check PMAY-Gramin."]
        if profile.income <= 600000:
            return True, ["Urban applicant does not own a pucca house and income is within EWS/LIG MVP range."]
        return False, ["Income exceeds the MVP range used for PMAY-Urban."]

    def _pmay_gramin(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.has_pucca_house:
            return False, ["Applicant already has a pucca house."]
        if not profile.rural_resident:
            return False, ["PMAY-Gramin is for rural households."]
        if profile.farmer_status or self._occupation_has(profile, "farmer", "agriculture", "cultivator"):
            return True, ["Farmer or agricultural household is treated as eligible for gramin housing support."]
        if profile.income <= 300000:
            return True, ["Rural applicant lacks a pucca house and income is within the MVP threshold."]
        return False, ["Income exceeds the MVP threshold used for PMAY-Gramin."]

    def _sc_student(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not profile.student_status:
            return False, ["Scholarship is for students."]
        if profile.category != "SC":
            return False, ["Scholarship requires Scheduled Caste category."]
        if profile.income <= 250000:
            return True, ["Student belongs to SC category and income is within Rs. 2.5 lakh."]
        return False, ["Income exceeds Rs. 2.5 lakh."]

    def _obc_student(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not profile.student_status:
            return False, ["Scholarship is for students."]
        if profile.category != "OBC":
            return False, ["Scholarship requires OBC category."]
        if profile.income <= 250000:
            return True, ["Student belongs to OBC category and income is within Rs. 2.5 lakh."]
        return False, ["Income exceeds Rs. 2.5 lakh."]

    def _disabled_student(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.student_status and profile.disability_status and profile.income <= 250000:
            return True, ["Applicant is a student with disability and income is within Rs. 2.5 lakh."]
        return False, ["Requires student status, disability certificate, and income within Rs. 2.5 lakh."]

    def _skill_training(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if 15 <= profile.age <= 45 and profile.employment_status in {"unemployed", "student"}:
            return True, ["Youth profile indicates need for skilling or employability training."]
        return False, ["Best suited for youth who are unemployed, students, or seeking skill training."]

    def _micro_business(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.employment_status == "self_employed" or self._occupation_has(profile, "business", "shop", "vendor", "enterprise"):
            return True, ["Profile indicates self-employment or micro-business activity."]
        return False, ["MUDRA is for micro or small business income-generating activities."]

    def _sukanya(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.gender == "female" and profile.age <= 10:
            return True, ["Girl child is below 10 years of age."]
        return False, ["Sukanya Samriddhi applies to a girl child below 10 years."]

    def _atal_pension(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if 18 <= profile.age <= 40 and profile.has_bank_account:
            return True, ["Applicant is between 18 and 40 and has a bank account."]
        return False, ["Requires age between 18 and 40 and a savings bank account."]

    def _vishwakarma(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        artisan_terms = ("artisan", "carpenter", "blacksmith", "potter", "tailor", "mason", "craft", "weaver", "goldsmith")
        if profile.age >= 18 and self._occupation_has(profile, *artisan_terms):
            return True, ["Occupation matches traditional artisan or craft work."]
        return False, ["Requires age 18 or above and traditional artisan/craft occupation."]

    def _startup(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if self._occupation_has(profile, "startup", "founder", "entrepreneur"):
            return True, ["Profile indicates startup or entrepreneurship activity."]
        return False, ["Startup India Seed Fund is for DPIIT-recognised startups through incubators."]

    def _pmgdisha(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.rural_resident and 14 <= profile.age <= 60:
            return True, ["Rural applicant is within the eligible digital literacy age band."]
        return False, ["Requires rural residency and age between 14 and 60."]

    def _standup_india(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.age < 18:
            return False, ["Applicant must be at least 18 years old."]
        if profile.gender == "female" or profile.category in {"SC", "ST"}:
            return True, ["Applicant is a woman entrepreneur or belongs to SC/ST category."]
        return False, ["Requires woman entrepreneur or SC/ST entrepreneur status."]

    def _pmegp(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.age >= 18 and profile.employment_status in {"unemployed", "self_employed"}:
            return True, ["Applicant is adult and profile indicates self-employment or enterprise intent."]
        return False, ["Requires adult applicant seeking self-employment through a new micro-enterprise."]

    def _ujjwala(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.gender == "female" and profile.age >= 18 and profile.income <= 200000:
            return True, ["Adult woman from a low-income household matches MVP PMUY criteria."]
        return False, ["Requires adult woman applicant from an eligible poor household."]

    def _jan_dhan(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.age >= 10 and not profile.has_bank_account:
            return True, ["Applicant is unbanked and old enough for a basic savings account."]
        return False, ["Jan Dhan is most relevant when the applicant does not already have a bank account."]

    def _old_age_pension(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if profile.age >= 60 and profile.income <= 120000:
            return True, ["Senior citizen income is within the MVP social pension threshold."]
        return False, ["Requires age 60 or above and low-income/BPL household status."]

    def _mjp_jay(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        if profile.income <= 100000:
            return True, ["Maharashtra resident with income within MVP health-assurance threshold."]
        return False, ["Income exceeds the MVP threshold for Maharashtra health assurance."]

    def _lek_ladki(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        if profile.gender == "female" and profile.age <= 18 and profile.income <= 100000:
            return True, ["Girl child in Maharashtra with low household income matches MVP criteria."]
        return False, ["Requires eligible girl child from a low-income Maharashtra household."]

    def _maha_ebc_scholarship(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        if profile.student_status and profile.income <= 800000:
            return True, ["Maharashtra student income is within the EBC scholarship MVP threshold."]
        return False, ["Requires Maharashtra student status and income within Rs. 8 lakh."]

    def _sanjay_gandhi(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        vulnerable = profile.disability_status or profile.occupation.casefold() in {"widow", "destitute"}
        if vulnerable and profile.income <= 21000:
            return True, ["Maharashtra vulnerable applicant income is within the MVP threshold."]
        return False, ["Requires vulnerable status and very low income in Maharashtra."]

    def _majhi_ladki_bahin(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        if profile.gender != "female":
            return False, ["Scheme is exclusively for women."]
        if not (21 <= profile.age <= 65):
            return False, [f"Age {profile.age} is outside the eligible range of 21 to 65 years."]
        if profile.income > 250000:
            return False, [f"Income of Rs. {profile.income} exceeds the limit of Rs. 2.5 Lakh per year."]
        return True, ["Applicant is a female Maharashtra resident aged 21-65 with eligible income."]

    def _namo_shetkari(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        if profile.farmer_status or self._occupation_has(profile, "farmer", "agriculture", "cultivator"):
            return True, ["Applicant is a landholder farmer in Maharashtra registered under PM-Kisan."]
        return False, ["Requires farmer status or agriculture-related occupation in Maharashtra."]

    def _ramai_awaas(self, profile: EligibilityRequest) -> tuple[bool, list[str]]:
        if not self._state_allowed(profile, "Maharashtra"):
            return False, ["Scheme is for Maharashtra residents."]
        if profile.has_pucca_house:
            return False, ["Applicant already owns a pucca house."]
        if profile.category not in {"SC", "ST"}:
            return False, ["Ramai Awas is for SC or ST category households."]
        if profile.income > 120000:
            return False, [f"Income of Rs. {profile.income} exceeds the limit of Rs. 1.2 Lakh per year."]
        return True, ["Applicant from SC/ST category lacks a pucca house and meets Maharashtra income limit."]
