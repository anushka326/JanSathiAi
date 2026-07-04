import { useEffect, useState } from "react";
import { X, Sparkles, Loader2, BookOpen } from "lucide-react";
import { explainScheme } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "./ui/button";

interface Props {
  schemeName: string | null;
  onClose: () => void;
}

export function ExplainDrawer({ schemeName, onClose }: Props) {
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  useEffect(() => {
    if (!schemeName) {
      setExplanation("");
      return;
    }

    async function loadExplanation() {
      setIsLoading(true);
      try {
        const text = await explainScheme(schemeName!, language);
        setExplanation(text);
      } catch (error) {
        setExplanation(t("explain.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    }

    loadExplanation();
  }, [schemeName, language]);

  if (!schemeName) return null;

  // Simple custom parser for markdown to prevent installing react-markdown
  const renderFormattedText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Header H3
      if (trimmed.startsWith("###")) {
        return <h3 key={idx} className="text-base font-bold text-foreground mt-4 mb-2 flex items-center gap-1.5 border-b pb-1">{trimmed.replace("###", "").trim()}</h3>;
      }
      // Header H4
      if (trimmed.startsWith("####")) {
        return <h4 key={idx} className="text-sm font-bold text-primary mt-3 mb-1">{trimmed.replace("####", "").trim()}</h4>;
      }
      // Unordered list
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground my-1 pl-2">
            <span className="text-primary mt-1 shrink-0">•</span>
            <span>{trimmed.substring(1).trim().replace(/\*\*(.*?)\*\*/g, "$1")}</span>
          </div>
        );
      }
      // Alert block
      if (trimmed.startsWith("> [!")) {
        return null; // Skip markdown alert tags, format body instead
      }
      if (trimmed.startsWith(">")) {
        return (
          <blockquote key={idx} className="border-l-4 border-primary/40 bg-primary/5 p-3 rounded-r-lg my-3 text-xs italic text-muted-foreground">
            {trimmed.substring(1).trim()}
          </blockquote>
        );
      }

      // Default paragraph (with bold text replacement)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(trimmed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(trimmed.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-foreground">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < trimmed.length) {
        parts.push(trimmed.substring(lastIndex));
      }

      return (
        <p key={idx} className="text-xs leading-relaxed text-muted-foreground my-2">
          {parts.length > 0 ? parts : trimmed}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-card border-l h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-foreground truncate max-w-[280px]">
                {schemeName}
              </h2>
              <p className="text-[10px] text-muted-foreground font-semibold">{t("explain.aiAssistant")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select 
              className="text-xs bg-background border rounded px-2 py-1 outline-none"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "mr")}
              aria-label={t("common.language")}
            >
              {Object.entries(supportedLanguages).map(([code, label]) => (
                <option key={code} value={code} className="text-foreground">
                  {label}
                </option>
              ))}
            </select>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs">{t("common.loading")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-transparent p-4 flex gap-3">
                <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">{t("explain.groundedContextTitle")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t("explain.groundedContextBody")}
                  </p>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert">
                {renderFormattedText(explanation)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between gap-3">
          <p className="text-[10px] text-muted-foreground">
            JanSathi AI • Privacy First GovTech MVP
          </p>
          <Button variant="outline" className="text-xs h-9" onClick={onClose}>
            {t("explain.closeDrawer")}
          </Button>
        </div>
      </div>
    </div>
  );
}
