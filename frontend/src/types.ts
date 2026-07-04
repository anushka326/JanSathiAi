export type Gender = "female" | "male" | "other" | "prefer_not_to_say";
export type Category = "General" | "OBC" | "SC" | "ST" | "EWS";
export type EmploymentStatus = "employed" | "self_employed" | "unemployed" | "student" | "retired";

export interface UserProfile {
  name?: string | null;
  age?: number | null;
  gender?: Gender | null;
  occupation?: string | null;
  income?: number | null;
  state?: string | null;
  disability_status?: boolean | null;
  category?: Category | null;
  student_status?: boolean | null;
  farmer_status?: boolean | null;
  employment_status?: EmploymentStatus | null;
  has_pucca_house?: boolean | null;
  rural_resident?: boolean | null;
  has_bank_account?: boolean | null;
  consent?: boolean | null;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  state: string;
  preferred_language?: "en" | "hi" | "mr";
  is_admin?: boolean;
  profile?: UserProfile | null;
}

export interface EligibilityRequest {
  name: string;
  consent: boolean;
  age: number;
  gender: Gender;
  occupation: string;
  income: number;
  state: string;
  disability_status: boolean;
  category: Category;
  student_status: boolean;
  farmer_status: boolean;
  employment_status: EmploymentStatus;
  has_pucca_house: boolean;
  rural_resident: boolean;
  has_bank_account: boolean;
}

export interface Scheme {
  scheme_name: string;
  category: string;
  state: string;
  eligibility: string[];
  income_limit: number;
  benefit: string;
  documents: string[];
  application_process: string;
  official_website: string;
  keywords: string[];
  summary: string;
}

export interface SchemeDecision {
  scheme: Scheme;
  reasons: string[];
  score: number;
  match_percentage: number;
  breakdown: Record<string, boolean>;
}

export interface EligibilityResponse {
  eligible_schemes: SchemeDecision[];
  ineligible_schemes: SchemeDecision[];
  profile_summary: Record<string, string | number | boolean>;
}
