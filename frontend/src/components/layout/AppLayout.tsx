import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Landmark, LogOut, Moon, Sun } from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Footer } from "./Footer";
import { Button } from "../ui/button";

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { language, supportedLanguages, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, updateLanguagePreference } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  // Dynamic Navigation Items
  const navItems = [
    { to: "/", label: t("common.nav.home"), hideIfAuth: true },
    { to: "/schemes", label: t("common.nav.schemes"), alwaysShow: true },
    { to: "/dashboard", label: t("common.nav.dashboard"), requireAuth: true },
    { to: "/eligibility", label: t("common.nav.eligibility"), requireAuth: true },
    { to: "/admin", label: t("common.nav.admin"), requireAdmin: true },
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.alwaysShow) return true;
    if (item.requireAdmin) return isAuthenticated && user?.is_admin;
    if (item.requireAuth) return isAuthenticated;
    if (item.hideIfAuth) return !isAuthenticated;
    return false;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-indigo-900/30 bg-[#0f172a] text-slate-100 shadow-xl backdrop-blur">
        {/* National Tricolour border top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />
        
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-900/40">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-extrabold tracking-tight text-white">JanSathi AI</span>
              <span className="block truncate text-[10px] font-semibold text-emerald-300">National Scheme Platform</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Primary navigation">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                      : "border border-transparent text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => {
                const nextLanguage = e.target.value as "en" | "hi" | "mr";
                setLanguage(nextLanguage);
                void updateLanguagePreference(nextLanguage);
              }}
              aria-label={t("common.language")}
              className="hidden h-10 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs text-slate-100 outline-none transition hover:border-emerald-400 md:inline-flex"
              style={{ colorScheme: "dark" }}
            >
              {Object.entries(supportedLanguages).map(([code, label]) => (
                <option key={code} value={code} style={{ backgroundColor: "#ffffff", color: "#0f172a", fontWeight: 600 }}>
                  {label}
                </option>
              ))}
            </select>

            <Button variant="ghost" className="h-10 w-10 rounded-lg border border-slate-600 bg-slate-800 p-0 text-slate-100 shadow-sm hover:bg-slate-700 hover:text-white" onClick={toggleTheme} aria-label={t("common.theme")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {isAuthenticated ? (
              <div className="ml-2 flex items-center gap-2.5 border-l border-slate-600 pl-3.5">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold truncate max-w-[120px] text-white">{user?.full_name}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide text-emerald-300">
                    {user?.is_admin ? t("common.userType.admin") : t("common.userType.citizen")}
                  </span>
                </div>
                <Button variant="ghost" className="h-9 rounded-lg border border-red-400/30 bg-red-950/40 px-3 text-xs text-red-300 hover:bg-red-950/70 hover:text-red-200" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>{t("common.logout")}</span>
                </Button>
              </div>
            ) : (
              <div className="ml-1 flex items-center gap-2 border-l border-slate-600 pl-3">
                <Link to="/login">
                  <Button variant="ghost" className="h-9 rounded-lg px-3 text-xs text-slate-200 hover:bg-white/10 hover:text-white">
                    {t("common.nav.login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="h-9 rounded-lg bg-emerald-500 px-3.5 text-xs text-white shadow-sm hover:bg-emerald-400">
                    {t("common.nav.register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-700 px-4 pb-3 pt-2 md:hidden" aria-label="Mobile navigation">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />
      <Footer />
    </div>
  );
}
