import axios from "axios";
import type { EligibilityRequest, EligibilityResponse, Scheme, SchemeDecision, User } from "../types";

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});
// Axios interceptor to inject Authorization token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Eligibility Check
export async function checkEligibility(payload: EligibilityRequest): Promise<EligibilityResponse> {
  const response = await api.post<EligibilityResponse>("/eligibility/check", payload);
  return response.data;
}

export async function getEligibilityHistory(): Promise<any[]> {
  const response = await api.get<any[]>("/eligibility/history");
  return response.data;
}

// Schemes List
export async function listSchemes(): Promise<Scheme[]> {
  const response = await api.get<Scheme[]>("/schemes");
  return response.data;
}

// Saved Schemes
export async function saveScheme(schemeName: string): Promise<any> {
  const response = await api.post("/schemes/save", { scheme_name: schemeName });
  return response.data;
}

export async function unsaveScheme(schemeName: string): Promise<any> {
  const response = await api.post("/schemes/unsave", { scheme_name: schemeName });
  return response.data;
}

export async function getSavedSchemes(): Promise<string[]> {
  const response = await api.get<string[]>("/schemes/saved");
  return response.data;
}

// RAG grounded Gemini Explanation
export async function explainScheme(schemeName: string, language: string = "en"): Promise<string> {
  const response = await api.post<{ explanation: string }>("/schemes/explain", {
    scheme_name: schemeName,
    language,
  });
  return response.data.explanation;
}

// OCR Processing
export async function uploadDocumentOCR(formData: FormData): Promise<any> {
  const response = await api.post("/ocr/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function updatePreferredLanguage(preferredLanguage: "en" | "hi" | "mr"): Promise<User> {
  const response = await api.put<User>("/auth/language", {
    preferred_language: preferredLanguage,
  });
  return response.data;
}

// User Feedback
export async function submitFeedback(payload: {
  rating: number;
  comment: string;
  user_name?: string;
  scheme_name?: string;
}): Promise<any> {
  const response = await api.post("/feedback", payload);
  return response.data;
}

export async function getFeedbackList(): Promise<any[]> {
  const response = await api.get<any[]>("/feedback");
  return response.data;
}

// Admin API
export async function getAdminAnalytics(): Promise<any> {
  const response = await api.get("/admin/analytics");
  return response.data;
}

export async function getAdminAuditLogs(): Promise<any[]> {
  const response = await api.get<any[]>("/admin/audit-logs");
  return response.data;
}

export async function adminAddScheme(scheme: Scheme): Promise<Scheme> {
  const response = await api.post<Scheme>("/admin/schemes", scheme);
  return response.data;
}

export async function adminUpdateScheme(schemeName: string, scheme: Scheme): Promise<Scheme> {
  const response = await api.put<Scheme>(`/admin/schemes/${encodeURIComponent(schemeName)}`, scheme);
  return response.data;
}

export async function adminDeleteScheme(schemeName: string): Promise<any> {
  const response = await api.delete(`/admin/schemes/${encodeURIComponent(schemeName)}`);
  return response.data;
}
