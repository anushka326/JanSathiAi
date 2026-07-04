import { Bookmark, BookmarkCheck, ExternalLink, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../hooks/useToast";
import type { SchemeDecision } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface Props {
  decision: SchemeDecision;
  status: "eligible" | "ineligible";
  onExplain?: (schemeName: string) => void;
}

const categoryIcons: Record<string, string> = {
  "Farmer": "🌾",
  "Education": "🎓",
  "Women Welfare": "👩",
  "Labour": "👨‍🏭",
  "Pension": "👴",
  "Disability Support": "🧑‍🦽",
  "Health": "❤️",
  "Housing": "🏠",
  "Business": "💼",
  "Girl Child": "👧",
  "Social Welfare": "🤝",
  "Skill Development": "⚙️",
};

export function SchemeDecisionCard({ decision, status, onExplain }: Props) {
  const { scheme, reasons, score, match_percentage, breakdown } = decision;
  const { user, savedSchemes, toggleSaveScheme } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const isSaved = savedSchemes.includes(scheme.scheme_name);
  const catIcon = categoryIcons[scheme.category] || "🇮🇳";
  const isHighMatch = (score || 0) >= 75;

  const breakdownLabels = Object.entries(breakdown || {}).filter(([, val]) => val);
  const explanationText = status === "eligible"
    ? t("schemes.decisionCard.profileOverlap", { reasons: breakdownLabels.length ? breakdownLabels.map(([key]) => key.replace(/_/g, " ")).join(", ") : t("schemes.decisionCard.matchingCriteria") })
    : t("schemes.decisionCard.eligibilityMismatch", { reasons: breakdownLabels.length ? breakdownLabels.map(([key]) => key.replace(/_/g, " ")).join(", ") : t("schemes.decisionCard.matchingCriteria") });

  async function handleSaveToggle() {
    if (!user) {
      showToast({
        title: t("schemes.decisionCard.authenticationRequiredTitle"),
        description: t("schemes.decisionCard.authenticationRequiredDescription"),
        variant: "error",
      });
      return;
    }
    
    try {
      await toggleSaveScheme(scheme.scheme_name);
      showToast({
        title: isSaved ? "Scheme Unsaved" : "Scheme Saved",
        description: `Successfully ${isSaved ? "removed" : "added"} '${scheme.scheme_name}' ${isSaved ? "from" : "to"} your library.`,
      });
    } catch (e) {
      showToast({
        title: t("schemes.decisionCard.actionFailed"),
        description: t("schemes.decisionCard.noDocumentsListed"),
        variant: "error",
      });
    }
  }

  return (
    <Card className={`relative shadow-sm transition hover:shadow-md ${status === "eligible" ? "border-primary/30 bg-primary/5" : "border-muted-foreground/10"}`}>
      {/* Top right badges */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
          status === "eligible" ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
        }`}>
          {match_percentage ? `${match_percentage}% Match` : status === "eligible" ? "Eligible" : "Ineligible"}
        </span>
      </div>

      <CardHeader className="pb-3 pr-24">
        <div className="flex gap-2.5 items-start">
          <span className="text-2xl shrink-0 p-1 bg-background rounded-lg border shadow-sm">{catIcon}</span>
          <div className="min-w-0">
            <CardTitle className="text-base font-bold leading-6 truncate">{scheme.scheme_name}</CardTitle>
            <CardDescription className="text-xs mt-0.5 leading-normal">{scheme.summary}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Match criteria breakdown checkmarks */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="rounded-lg border bg-background/50 p-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{t("schemes.decisionCard.matchingCriteria")}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {Object.entries(breakdown).map(([key, val]) => (
                <span key={key} className={`flex items-center gap-1 font-medium ${val ? "text-primary" : "text-muted-foreground opacity-60"}`}>
                  <span>{val ? "✔" : "✘"}</span>
                  <span className="capitalize text-[10px]">{key}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-background/50 p-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("schemes.decisionCard.recommendationExplanation")}</p>
          <p className="mt-1 text-xs text-foreground">{explanationText}</p>
        </div>

        {/* Reason breakdown */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("schemes.decisionCard.evaluationReasons")}</p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground leading-relaxed pl-4 list-disc">
            {reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>

        {/* Details list for eligible schemes */}
        {status === "eligible" && (
          <div className="grid gap-2.5 rounded-lg bg-background p-3 border shadow-inner">
            <div>
              <p className="text-xs font-semibold text-foreground">{t("schemes.decisionCard.schemeBenefit")}</p>
              <p className="text-xs text-muted-foreground leading-normal mt-0.5">{scheme.benefit}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{t("schemes.decisionCard.requiredDocuments")}</p>
              <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                {scheme.documents.length ? scheme.documents.join(", ") : t("schemes.decisionCard.noDocumentsListed")}
              </p>
            </div>
          </div>
        )}

        {/* Action button triggers */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-t pt-3.5">
          <span className="text-xs text-muted-foreground font-medium pt-2">{scheme.state} resident</span>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className={`h-9 w-9 p-0 border rounded-lg ${isSaved ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
              onClick={handleSaveToggle}
              title={isSaved ? t("schemes.decisionCard.removeFromSaved") : t("schemes.decisionCard.saveScheme")}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            
            {onExplain && (
              <Button
                variant="outline"
                className="h-9 px-3 border-primary/20 text-primary hover:bg-primary/5 rounded-lg text-xs"
                onClick={() => onExplain(scheme.scheme_name)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                <span>{t("schemes.decisionCard.explainWithAI")}</span>
              </Button>
            )}

            <Button
              variant="ghost"
              className="h-9 w-9 p-0 border rounded-lg"
              onClick={() => window.open(scheme.official_website, "_blank", "noopener,noreferrer")}
              title={t("schemes.decisionCard.officialPortal")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
