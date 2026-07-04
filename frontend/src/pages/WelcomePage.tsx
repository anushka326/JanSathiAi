import { useNavigate } from "react-router-dom";
import { CheckCircle2, Languages } from "lucide-react";

import { LANGUAGE_STORAGE_KEY, useLanguage, type Language } from "../context/LanguageContext";

const languageCards: Array<{ code: Language; flag: string; title: string; subtitle: string }> = [
  { code: "en", flag: "GB", title: "English", subtitle: "Continue in English" },
  { code: "hi", flag: "IN", title: "हिन्दी", subtitle: "हिन्दी में जारी रखें" },
  { code: "mr", flag: "IN", title: "मराठी", subtitle: "मराठीत पुढे चला" },
];

export function WelcomePage() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  function chooseLanguage(nextLanguage: Language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setLanguage(nextLanguage);
    navigate("/", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-[78vh] max-w-5xl flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Languages className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Choose Your Preferred Language</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          JanSathi AI will remember your choice for future visits and authenticated sessions.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {languageCards.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => chooseLanguage(item.code)}
            className={`group rounded-2xl border bg-card p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-soft ${
              language === item.code ? "border-primary ring-2 ring-primary/15" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{item.flag}</p>
                <h2 className="mt-3 text-2xl font-extrabold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              {language === item.code ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
            </div>
            <span className={`mt-6 inline-flex h-10 w-full items-center justify-center rounded-md border px-4 text-sm font-medium transition ${
              language === item.code
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background group-hover:border-primary group-hover:text-primary"
            }`}>
              {t("landing.startButton")}
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
