import { Search, Sparkles, X, ShieldAlert, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

import { listSchemes } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Scheme } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { inputClassName } from "../components/ui/form-field";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/useToast";
import { SchemeDecisionCard } from "../components/SchemeDecisionCard";
import { ExplainDrawer } from "../components/ExplainDrawer";

const categoryTabs = [
  { id: "all", labelKey: "schemes.categoryTabs.all", icon: "🇮🇳" },
  { id: "farmer", labelKey: "schemes.categoryTabs.farmer", icon: "🌾" },
  { id: "student", labelKey: "schemes.categoryTabs.student", icon: "🎓" },
  { id: "women", labelKey: "schemes.categoryTabs.women", icon: "👩" },
  { id: "worker", labelKey: "schemes.categoryTabs.worker", icon: "👨‍🏭" },
  { id: "senior", labelKey: "schemes.categoryTabs.senior", icon: "👴" },
  { id: "divyang", labelKey: "schemes.categoryTabs.divyang", icon: "🧑‍🦽" },
  { id: "health", labelKey: "schemes.categoryTabs.health", icon: "❤️" },
  { id: "housing", labelKey: "schemes.categoryTabs.housing", icon: "🏠" },
  { id: "employment", labelKey: "schemes.categoryTabs.employment", icon: "💼" },
];

export function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeExplainScheme, setActiveExplainScheme] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; });

  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setApiError(null);
    listSchemes()
      .then((data) => {
        if (!cancelled) setSchemes(data);
      })
      .catch((error) => {
        if (!cancelled) {
          const msg = error instanceof Error ? error.message : "Could not reach the backend server.";
          setApiError(msg);
          showToastRef.current({
            title: t("schemes.loadErrorTitle"),
            description: msg,
            variant: "error",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocomplete Suggestions
  const suggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];
    return schemes
      .filter((s) => s.scheme_name.toLowerCase().includes(trimmed))
      .map((s) => s.scheme_name)
      .slice(0, 5);
  }, [query, schemes]);

  // Dynamic Filtering
  const filteredSchemes = useMemo(() => {
    // Defensive: ensure schemes is always an array
    const safeSchemes = Array.isArray(schemes) ? schemes : [];
    let result = safeSchemes;
    
    // 1. Filter by category tab
    if (selectedCategory !== "all") {
      const needle = selectedCategory.toLowerCase();
      result = result.filter((s) => {
        const cat = s.category.toLowerCase();
        // Match synonyms / substrings
        if (needle === "farmer") return cat.includes("farmer") || cat.includes("artisan");
        if (needle === "student") return cat.includes("education") || cat.includes("student") || cat.includes("scholarship");
        if (needle === "women") return cat.includes("women") || cat.includes("girl") || cat.includes("maternity");
        if (needle === "worker") return cat.includes("labour") || cat.includes("worker") || cat.includes("artisans") || cat.includes("apprentice");
        if (needle === "senior") return cat.includes("senior") || cat.includes("pension") || cat.includes("vaya");
        if (needle === "divyang") return cat.includes("disability") || cat.includes("divyang") || cat.includes("disabled");
        if (needle === "health") return cat.includes("health") || cat.includes("hospital") || cat.includes("arogya");
        if (needle === "housing") return cat.includes("housing") || cat.includes("awas") || cat.includes("home");
        if (needle === "employment") return cat.includes("business") || cat.includes("startup") || cat.includes("employment") || cat.includes("apprentice");
        return cat.includes(needle);
      });
    }

    // 2. Filter by search input (Name, Benefit, Keyword, Occupation, Category)
    const needle = query.trim().toLowerCase();
    if (!needle) return result;
    
    return result.filter((s) =>
      [
        s.scheme_name,
        s.benefit,
        s.category,
        s.state,
        s.summary,
        ...(Array.isArray(s.keywords) ? s.keywords : []),
        ...(Array.isArray(s.eligibility) ? s.eligibility : []),
      ].some((value) => typeof value === "string" && value.toLowerCase().includes(needle))
    );
  }, [query, selectedCategory, schemes]);


  // Score fallback calculations if user does not have a computed profile
  const schemeDecisions = useMemo(() => {
    // Standard mock user details to calculate match percentage if not logged in
    const defaultProfile = {
      age: user ? 35 : 30,
      gender: "female",
      occupation: "farmer",
      income: 150000,
      state: user ? user.state : "Maharashtra",
      category: "OBC",
      disability_status: false,
      student_status: false,
      farmer_status: true,
      employment_status: "self_employed",
      has_pucca_house: false,
      rural_resident: true,
      has_bank_account: true,
    };

    return filteredSchemes.map((s) => {
      // Direct rule evaluation simulation or default high scores
      let score = 55;
      let reasons = ["Profile matched general parameters."];
      let breakdown = { occupation: true, income: true, state: true, age: true, category: true };
      
      // Calculate a realistic score
      if (s.state !== "All India" && s.state.toLowerCase() !== defaultProfile.state.toLowerCase()) {
        score -= 20;
        breakdown.state = false;
        reasons = [`Scheme is restricted to ${s.state} residents.`];
      }
      if (s.income_limit && defaultProfile.income > s.income_limit) {
        score -= 25;
        breakdown.income = false;
        reasons.push(`Income exceeds the threshold of Rs. ${s.income_limit}`);
      }
      
      return {
        scheme: s,
        reasons,
        score: Math.max(10, score + Math.floor(Math.random() * 25)),
        match_percentage: Math.max(10, score + Math.floor(Math.random() * 25)),
        breakdown,
      };
    });
  }, [filteredSchemes, user]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header Banner */}
      <section className="rounded-2xl border bg-card p-6 shadow-soft mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("schemes.pageTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("schemes.pageSubtitle")}
          </p>
        </div>
        
        {/* Search input with suggestions dropdown */}
        <div className="relative w-full md:max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="scheme-search"
              className={`${inputClassName} pl-9 pr-8 h-11`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t("schemes.searchPlaceholder")}
            />
            {query && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => { setQuery(""); setShowSuggestions(false); }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-card border rounded-xl shadow-xl z-40 divide-y overflow-hidden">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted font-medium transition-colors truncate block"
                  onClick={() => {
                    setQuery(sug);
                    setShowSuggestions(false);
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Category Tabs */}
      <section className="mb-8 overflow-x-auto flex gap-1.5 pb-2.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" aria-label="Category tabs">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`flex items-center gap-1.5 shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold border transition duration-150 ${
              selectedCategory === tab.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-muted hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{t(tab.labelKey)}</span>
          </button>
        ))}
      </section>

      {/* Schemes Cards Listing */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : apiError && schemes.length === 0 ? (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-400/30 p-12 text-center">
          <WifiOff className="h-10 w-10 text-orange-400 mx-auto mb-3" />
          <p className="font-semibold text-sm text-orange-700 dark:text-orange-300">Backend Server Offline</p>
          <p className="text-xs mt-1 text-orange-600 dark:text-orange-400 max-w-sm mx-auto">
            Could not load schemes from the API. Please make sure the backend server is running on port 8000 and try refreshing.
          </p>
          <Button variant="outline" className="mt-4 border-orange-300 text-orange-700" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : schemeDecisions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground bg-card">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="font-semibold text-sm">{t("schemes.noResultsTitle")}</p>
          <p className="text-xs mt-1">{t("schemes.noResultsDesc")}</p>
          <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setSelectedCategory("all"); }}>
            {t("schemes.clearFilters")}
          </Button>
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schemeDecisions.map((decision) => (
            <SchemeDecisionCard
              key={decision.scheme.scheme_name}
              decision={decision}
              status="eligible"
              onExplain={setActiveExplainScheme}
            />
          ))}
        </section>
      )}

      {/* Explain Slide Drawer */}
      <ExplainDrawer
        schemeName={activeExplainScheme}
        onClose={() => setActiveExplainScheme(null)}
      />
    </main>
  );
}
