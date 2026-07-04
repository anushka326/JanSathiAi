import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, HelpCircle } from "lucide-react";

import { EligibilityForm } from "../components/EligibilityForm";
import { SchemeDecisionCard } from "../components/SchemeDecisionCard";
import type { EligibilityResponse } from "../types";
import { ExplainDrawer } from "../components/ExplainDrawer";
import { Button } from "../components/ui/button";
import { useLanguage } from "../context/LanguageContext";

export function EligibilityPage() {
  const [result, setResult] = useState<EligibilityResponse | null>(null);
  const [activeExplainScheme, setActiveExplainScheme] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "eligible" | "ineligible">("all");
  const { t } = useLanguage();

  const eligibleCount = result?.eligible_schemes.length ?? 0;
  const ineligibleCount = result?.ineligible_schemes.length ?? 0;
  const visibleEligible = filter !== "ineligible" ? result?.eligible_schemes ?? [] : [];
  const visibleIneligible = filter !== "eligible" ? result?.ineligible_schemes ?? [] : [];

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[460px_minmax(0,1fr)] lg:px-8">
      <section className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-auto">
        <EligibilityForm onResult={setResult} />

        <div className="flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">{t("eligibility.pageBannerTitle")}</p>
            <p className="mt-0.5 leading-normal opacity-90">{t("eligibility.pageBannerText")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5" aria-live="polite">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t("eligibility.pageTitle")}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{t("eligibility.pageSubtitle")}</p>
          </div>
          {result && (
            <Link to="/schemes">
              <Button variant="outline" className="text-xs">
                {t("eligibility.browseDirectory")}
              </Button>
            </Link>
          )}
        </div>

        {!result ? (
          <div className="grid gap-4">
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground/45" />
              <p className="font-semibold">{t("eligibility.welcomeBannerTitle")}</p>
              <p className="mt-1 max-w-sm text-xs leading-normal">{t("eligibility.welcomeBannerDescription")}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="rounded-xl border bg-card p-4 text-xs">
                  <p className="font-semibold">{t("eligibility.stepTitle", { step })}</p>
                  <p className="mt-1 text-muted-foreground">{t(`eligibility.step${["One", "Two", "Three", "Four"][step - 1]}`)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="rounded-xl border bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("eligibility.profileSnapshotTitle")}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(result.profile_summary).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="rounded-2xl border bg-background p-3 text-xs">
                      <p className="uppercase tracking-[0.24em] text-muted-foreground">{key.replace(/_/g, " ")}</p>
                      <p className="mt-1 truncate font-semibold text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("eligibility.quickResultsTitle")}
                  </p>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-2xl border bg-background p-3 text-xs">
                      <p className="text-muted-foreground">{t("eligibility.eligibleSchemesLabel")}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{eligibleCount}</p>
                    </div>
                    <div className="rounded-2xl border bg-background p-3 text-xs">
                      <p className="text-muted-foreground">{t("eligibility.ineligibleSchemesLabel")}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{ineligibleCount}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("eligibility.filterViewTitle")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["all", "eligible", "ineligible"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          filter === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-300 bg-background text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                        onClick={() => setFilter(value)}
                      >
                        {t(`common.schemeFilters.${value}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("eligibility.outcomeHeading")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {t("eligibility.outcomeCopy", { eligible: eligibleCount, ineligible: ineligibleCount })}
                </p>
              </div>
              <div className="rounded-2xl bg-background px-4 py-3 text-xs text-muted-foreground">
                {eligibleCount > 0 ? t("eligibility.highPriorityHint") : t("eligibility.reviewProfileHint")}
              </div>
            </div>

            {visibleEligible.length > 0 ? (
              <div>
                <h2 className="mb-3.5 flex items-center gap-2 text-base font-extrabold">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>
                    {t("eligibility.eligibleSchemesLabel")} ({visibleEligible.length})
                  </span>
                </h2>
                <div className="grid gap-4">
                  {visibleEligible.map((decision) => (
                    <SchemeDecisionCard
                      key={decision.scheme.scheme_name}
                      decision={decision}
                      status="eligible"
                      onExplain={setActiveExplainScheme}
                    />
                  ))}
                </div>
              </div>
            ) : filter !== "ineligible" ? (
              <div className="rounded-xl border bg-card p-6 text-center text-xs text-muted-foreground">
                {t("eligibility.noEligibleSchemes")}
              </div>
            ) : null}

            {visibleIneligible.length > 0 && (
              <details className="group w-full min-w-0 overflow-hidden rounded-xl border bg-card shadow-soft">
                <summary className="flex cursor-pointer select-none items-center justify-between bg-muted/20 p-4 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  <span>
                    {t("eligibility.ineligibleSchemesLabel")} ({visibleIneligible.length})
                  </span>
                  <span className="transition duration-200 group-open:rotate-180">v</span>
                </summary>
                <div className="flex w-full min-w-0 flex-col gap-4 border-t bg-muted/5 p-4">
                  {visibleIneligible.map((decision) => (
                    <SchemeDecisionCard
                      key={decision.scheme.scheme_name}
                      decision={decision}
                      status="ineligible"
                      onExplain={setActiveExplainScheme}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </section>

      <ExplainDrawer schemeName={activeExplainScheme} onClose={() => setActiveExplainScheme(null)} />
    </main>
  );
}
