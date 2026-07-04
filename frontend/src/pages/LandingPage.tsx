import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Cpu, Eye, FileSpreadsheet, Fingerprint, HelpCircle, Landmark, ShieldCheck, Sparkles, Users, XCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";

const stats = [
  { value: "48+", label: "Government Schemes", icon: FileSpreadsheet },
  { value: "9+", label: "Citizen Categories", icon: Users },
  { value: "AI-Powered", label: "Smart RAG Explanations", icon: Sparkles },
  { value: "Privacy-First", label: "AES-256 Encryption", icon: ShieldCheck },
];

const categories = [
  { name: "Farmers", icon: "🌾", desc: "Income support, crop insurance, subsidies, and credit." },
  { name: "Students", icon: "🎓", desc: "Scholarships, skill loans, fee exemptions, and awards." },
  { name: "Women Welfare", icon: "👩", desc: "Social pensions, maternity benefits, and enterprise support." },
  { name: "Workers", icon: "👨‍🏭", desc: "Social security, registration cards, and insurance." },
  { name: "Seniors", icon: "👴", desc: "Subsidized pensions, tax relief, savings accounts." },
  { name: "Divyang", icon: "🧑‍🦽", desc: "UDID cards, free assistive devices, and pensions." },
  { name: "Health", icon: "❤️", desc: "Cashless secondary/tertiary hospital assurance." },
  { name: "Housing", icon: "🏠", desc: "Affordable urban and rural housing financial aid." },
  { name: "Jobs & Startups", icon: "💼", desc: "Greenfield enterprise loans, self-employment grants." }
];

const problems = [
  {
    title: "Scattered Scheme Data",
    desc: "Schemes are published across dozens of state & central portal URLs, making comparison nearly impossible.",
    isSolution: false,
  },
  {
    title: "Unified Scheme Directory",
    desc: "JanSathi aggregates central and state schemes in one indexed database with smart autocomplete search.",
    isSolution: true,
  },
  {
    title: "Black-box AI Hallucinations",
    desc: "General AI chatbots frequently hallucinate scheme eligibility details, creating false user expectations.",
    isSolution: false,
  },
  {
    title: "Deterministic Rule Engine",
    desc: "Eligibility is computed by rule-based, audited logic first. AI is only used to explain details, not make rules.",
    isSolution: true,
  },
  {
    title: "Exposed Personal PII",
    desc: "Registering on portal sites forces citizens to input unmasked Aadhaar numbers or store files on server disks.",
    isSolution: false,
  },
  {
    title: "AES Encrypted & PII Masking",
    desc: "Aadhaar and PAN details are masked in-memory. File uploads are purged instantly. Sensitive PII is AES-encrypted.",
    isSolution: true,
  },
];

export function LandingPage() {
  const { t, supportedLanguages, language } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-36" style={{background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 25%, #0d5c4a 60%, #134e4a 100%)"}}>
        {/* Decorative glowing orbs */}
        <div className="absolute top-[-80px] left-[-80px] h-[400px] w-[400px] rounded-full opacity-20 blur-3xl" style={{background: "radial-gradient(circle, #10b981 0%, transparent 70%)"}} />
        <div className="absolute bottom-[-60px] right-[-60px] h-[350px] w-[350px] rounded-full opacity-15 blur-3xl" style={{background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)"}} />
        <div className="absolute top-[40%] left-[55%] h-[200px] w-[200px] rounded-full opacity-10 blur-2xl" style={{background: "radial-gradient(circle, #6366f1 0%, transparent 70%)"}} />

        {/* Ashoka Chakra background watermark */}
        <div className="absolute right-[-5%] top-[-5%] opacity-[0.06] select-none pointer-events-none text-emerald-300">
          <Landmark className="h-[600px] w-[600px]" />
        </div>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px"}} />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-8 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Government Scheme Discovery
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl drop-shadow-2xl">
            {t("landing.heroTitle")}
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t("landing.heroSubtitle")}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span>{t("common.language")}:</span>
            {Object.entries(supportedLanguages).map(([code, label]) => (
              <span
                key={code}
                className={`rounded-full border px-3 py-1 transition ${language === code ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-white/20 bg-white/5 text-slate-300"}`}
              >
                {label}
              </span>
            ))}
          </div>
          
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-900/40 font-bold">
                <span>{t("landing.startButton")}</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/schemes">
              <Button variant="outline" className="h-12 px-8 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur font-semibold">
                {t("landing.browseButton")}
              </Button>
            </Link>
          </div>

          {/* Floating trust badges */}
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            {[
              { icon: ShieldCheck, label: "AES-256 Encrypted" },
              { icon: Cpu, label: "Deterministic AI Rules" },
              { icon: Eye, label: "No PII Stored on Disk" },
              { icon: Fingerprint, label: "Privacy-First Design" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur">
                <Icon className="h-3.5 w-3.5 text-emerald-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* Statistics Strip */}
      <section className="bg-primary py-8 text-primary-foreground border-y border-white/10 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-x-4 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <span className="p-2 bg-white/10 rounded-lg">
                  <stat.icon className="h-6 w-6" />
                </span>
                <span className="text-3xl font-extrabold">{stat.value}</span>
                <span className="text-sm opacity-80">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why JanSathi AI?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              How our architecture solves the problems found in typical scheme discovery apps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {problems.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-6 bg-card flex gap-4 shadow-sm hover:shadow-md transition-shadow ${
                  item.isSolution ? "border-primary/30 bg-primary/5" : "border-destructive/20 bg-destructive/5"
                }`}
              >
                <span className="mt-1 shrink-0">
                  {item.isSolution ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                </span>
                <div>
                  <h3 className="font-semibold text-base text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Explore Scheme Categories
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Comprehensive benefits tailored for the primary pillars of Indian society.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-6 shadow-sm hover:-translate-y-1 transition duration-200">
                <span className="text-3xl block mb-4">{cat.icon}</span>
                <h3 className="font-semibold text-lg text-foreground mb-2">{cat.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/40 border-t border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The JanSathi AI Workflow
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From profile setup to claiming benefits, we ensure a seamless and private experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 text-center relative">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-4 text-lg">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Build Profile or Upload ID</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Fill the eligibility form, or upload your ID (Aadhaar/PAN) to run instant OCR auto-fill with masked security.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-4 text-lg">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Deterministic Scoring</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Our rule engine checks your profile against the scheme database to return exact eligible matches with audit scores.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mb-4 text-lg">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Explain with AI</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Query individual schemes using semantic search. Gemini generates structured, grounded markdown answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to find your eligible benefits?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-lg opacity-90">
            Sign up today to discover, save, and learn about government schemes with absolute privacy.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register">
              <Button className="bg-white text-primary hover:bg-white/95 h-12 px-6">
                Register Citizen Profile
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 h-12 px-6">
                Citizen Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
