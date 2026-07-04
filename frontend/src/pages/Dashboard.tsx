import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bookmark, BookmarkX, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

import { useAuth } from "../context/AuthContext";
import { checkEligibility, getEligibilityHistory } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/useToast";

export function Dashboard() {
  const { user, savedSchemes, toggleSaveScheme } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [recommendedSchemes, setRecommendedSchemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    const currentUser = user;
    
    async function loadHistory() {
      try {
        const hist = await getEligibilityHistory();
        setHistory(hist);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setIsLoading(false);
      }
    }

    async function loadRecommendations() {
      if (!currentUser.profile || !currentUser.profile.occupation || !currentUser.profile.state) {
        setRecommendedSchemes([]);
        return;
      }

      setIsLoadingRecommendations(true);
      try {
        const result = await checkEligibility({
          name: currentUser.full_name || "Anonymous Citizen",
          consent: true,
          age: currentUser.profile.age ?? 18,
          gender: currentUser.profile.gender || "prefer_not_to_say",
          occupation: currentUser.profile.occupation || "",
          income: currentUser.profile.income ?? 0,
          state: currentUser.profile.state || currentUser.state,
          disability_status: currentUser.profile.disability_status ?? false,
          category: currentUser.profile.category || "General",
          student_status: currentUser.profile.student_status ?? false,
          farmer_status: currentUser.profile.farmer_status ?? false,
          employment_status: currentUser.profile.employment_status || "unemployed",
          has_pucca_house: currentUser.profile.has_pucca_house ?? false,
          rural_resident: currentUser.profile.rural_resident ?? false,
          has_bank_account: currentUser.profile.has_bank_account ?? true,
        });
        setRecommendedSchemes(result.eligible_schemes.slice(0, 4));
      } catch (err) {
        console.error("Failed to load recommendations", err);
        setRecommendedSchemes([]);
      } finally {
        setIsLoadingRecommendations(false);
      }
    }

    loadHistory();
    loadRecommendations();
  }, [user, navigate]);

  async function handleRemoveScheme(name: string) {
    try {
      await toggleSaveScheme(name);
      showToast({ title: t("dashboard.schemeRemovedTitle"), description: t("dashboard.schemeRemovedDescription", { scheme: name }) });
    } catch (e) {
      showToast({ title: t("dashboard.actionFailedTitle"), description: t("dashboard.unsaveFailed"), variant: "error" });
    }
  }

  if (!user) {
    return null;
  }

  const currentUser = user;

  // Get last profile checked
  const lastCheck = history.length > 0 ? history[0] : null;
  const lastProfile = lastCheck ? lastCheck.profile : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 border mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">{t("dashboard.portalTitle")}</p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">{t("dashboard.welcome", { name: currentUser.full_name })}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
            {t("dashboard.activeState", { state: currentUser.state })}
          </p>
        </div>
        <div className="flex gap-2">
          {currentUser.is_admin ? (
            <Link to="/admin">
              <Button variant="outline" className="h-11">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                <span>{t("dashboard.adminPanel")}</span>
              </Button>
            </Link>
          ) : null}
          <Link to="/eligibility">
            <Button className="h-11 px-5">
              <span>{t("dashboard.startWizard")}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.totalRecommendations")}</CardDescription>
            <CardTitle className="text-3xl font-extrabold mt-1">
              {isLoading ? <Skeleton className="h-9 w-12" /> : history.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t("dashboard.historyLogs")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.savedSchemes")}</CardDescription>
            <CardTitle className="text-3xl font-extrabold mt-1">{savedSchemes.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t("dashboard.personalLibraryBookmarked")}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.securityProtection")}</CardDescription>
            <CardTitle className="text-3xl font-extrabold mt-1 text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
              <span className="text-xl">AES-256</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{t("dashboard.encryptionNotice")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column: Saved Schemes & History */}
        <div className="space-y-8">
          {/* Saved Schemes Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <span>{t("dashboard.personalLibrary")}</span>
              </CardTitle>
              <CardDescription>
                {t("dashboard.personalLibraryDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedSchemes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                  {t("dashboard.noSavedSchemes")}
                  <div className="mt-4">
                    <Link to="/schemes">
                      <Button variant="outline">{t("dashboard.browseDirectory")}</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {savedSchemes.map((name) => (
                    <div key={name} className="flex items-center justify-between p-3.5 border rounded-xl bg-card hover:bg-muted/10 transition-colors">
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.schemeSource")}</p>
                      </div>
                      <Button variant="ghost" className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveScheme(name)}>
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Schemes */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>{t("dashboard.recommendedSchemes")}</span>
              </CardTitle>
              <CardDescription>
                {t("dashboard.recommendedDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecommendations ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : recommendedSchemes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                  {t("dashboard.noRecommendations")}
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedSchemes.map((decision) => (
                    <div key={decision.scheme.scheme_name} className="rounded-xl border bg-muted/10 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{decision.scheme.scheme_name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{decision.scheme.summary}</p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {decision.match_percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Profile Summary */}
        <div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("dashboard.profileSummaryTitle")}</CardTitle>
              <CardDescription>{t("dashboard.profileSummaryDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-sm">
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground">{currentUser.full_name}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground">{currentUser.email}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-muted-foreground">State of Residence</span>
                  <span className="font-medium text-foreground">{currentUser.state}</span>
                </div>
                {currentUser.profile && Object.values(currentUser.profile).some((value) => value !== null && value !== undefined && value !== "") ? (
                  <>
                    <div className="flex justify-between py-2.5">
                      <span className="text-muted-foreground">{t("dashboard.profileFieldAge")}</span>
                      <span className="font-medium text-foreground">{currentUser.profile.age ?? "—"} yrs</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-muted-foreground">{t("dashboard.profileFieldGender")}</span>
                      <span className="font-medium text-foreground capitalize">{currentUser.profile.gender ?? "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-muted-foreground">{t("dashboard.profileFieldOccupation")}</span>
                      <span className="font-medium text-foreground capitalize">{currentUser.profile.occupation ?? "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-muted-foreground">{t("dashboard.profileFieldIncome")}</span>
                      <span className="font-medium text-foreground">{currentUser.profile.income ? `Rs. ${currentUser.profile.income.toLocaleString()}` : "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-muted-foreground">{t("dashboard.profileFieldCategory")}</span>
                      <span className="font-medium text-foreground">{currentUser.profile.category ?? "—"}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-muted-foreground">{t("dashboard.profileFieldDisability")}</span>
                      <span className="font-medium text-foreground">{currentUser.profile.disability_status ? "Yes" : "No"}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    {t("dashboard.completeProfileNotice")}
                  </div>
                )}
              </div>
              <div className="mt-6">
                <Link to="/eligibility">
                  <Button variant="outline" className="w-full">
                    {t("dashboard.updateProfileButton")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
