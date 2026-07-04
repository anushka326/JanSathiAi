import { Link } from "react-router-dom";
import { ExternalLink, Github, Landmark, Linkedin, ShieldCheck } from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

const creators = [
  {
    name: "Prachi Dudhankar",
    github: "https://github.com/Prachi-44",
    linkedin: "https://www.linkedin.com/in/prachi-dudhankar-3700422b7/",
  },
  {
    name: "Anushka Pise",
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/",
  },
];

const techStack = ["React", "TypeScript", "FastAPI", "MongoDB", "Gemini AI", "RAG", "OCR", "Tailwind CSS", "ChromaDB"];

const resourceLinks = [
  { label: "MyScheme", href: "https://www.myscheme.gov.in/" },
  { label: "PM Kisan", href: "https://pmkisan.gov.in/" },
  { label: "Ayushman Bharat", href: "https://pmjay.gov.in/" },
  { label: "National Scholarship Portal", href: "https://scholarships.gov.in/" },
  { label: "MahaDBT", href: "https://mahadbt.maharashtra.gov.in/" },
];

export function Footer() {
  const { t } = useLanguage();
  const quickLinks = [
    { to: "/", label: t("footer.links.home") },
    { to: "/schemes", label: t("footer.links.schemes") },
    { to: "/eligibility", label: t("footer.links.eligibility") },
    { to: "/dashboard", label: t("footer.links.dashboard") },
    { to: "/admin", label: t("common.nav.admin") },
  ];

  return (
    <footer className="border-t border-white/10 bg-background/80 text-sm text-muted-foreground backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1.4fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-card/70 px-4 py-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-extrabold text-foreground">JanSathi AI</p>
                <p className="text-xs text-muted-foreground">{t("footer.platformLabel")}</p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-relaxed">{t("footer.aboutText")}</p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("footer.technologyUsed")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {techStack.map((item) => (
                  <span key={item} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("footer.quickLinks")}</p>
              <ul className="mt-4 space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-foreground transition hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
                <li>Contact</li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("footer.resourcesTitle")}</p>
              <ul className="mt-4 space-y-2">
                {resourceLinks.map((resource) => (
                  <li key={resource.label}>
                    <a href={resource.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground transition hover:text-primary">
                      {resource.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0d5c4a] p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-orange-500 to-emerald-400" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{t("footer.developedBy")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {creators.map((creator, idx) => {
                const initials = creator.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();
                const colors = [
                  { ring: "border-emerald-400/50", bg: "from-emerald-600 to-teal-700", badge: "bg-emerald-500/20 text-emerald-300" },
                  { ring: "border-violet-400/50", bg: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-300" },
                ];
                const c = colors[idx % colors.length];
                return (
                  <div key={creator.name} className={`rounded-xl border ${c.ring} bg-white/5 p-4 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-sm font-extrabold text-white shadow-md`}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-white leading-tight">{creator.name}</p>
                        <p className={`text-[10px] font-semibold rounded-full px-2 py-0.5 inline-block mt-0.5 ${c.badge}`}>{t("footer.creatorRole")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={creator.github} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:border-amber-300 hover:bg-amber-400 hover:text-slate-950" aria-label={`${creator.name} GitHub`}>
                        <Github className="h-4 w-4" />
                      </a>
                      <a href={creator.linkedin} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:border-blue-400 hover:bg-blue-500 hover:text-white" aria-label={`${creator.name} LinkedIn`}>
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" />
            JanSathi AI
          </span>
          <p className="max-w-4xl leading-relaxed sm:text-right">{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
