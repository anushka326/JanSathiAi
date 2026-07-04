import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Landmark, Loader2, Lock, Mail, ShieldAlert, User } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../hooks/useToast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Field, checkboxClassName, inputClassName } from "../components/ui/form-field";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { registerUser } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password || !state) {
      showToast({ title: t("auth.validationError"), description: t("auth.validationError"), variant: "error" });
      return;
    }
    if (!consent) {
      showToast({
        title: t("auth.consentError"),
        description: t("auth.consentError"),
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await registerUser(fullName, email, state, password, consent, language);
      showToast({ title: t("auth.registerTitle"), description: t("auth.registrationSuccess") });
      navigate("/dashboard");
    } catch (err: any) {
      showToast({
        title: t("auth.registerTitle"),
        description: err.response?.data?.detail || t("auth.registrationFailed"),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-6 w-6" />
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.registerTitle")}</CardTitle>
          <CardDescription>
            {t("auth.registerDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label={t("auth.fullNameLabel")}>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  className={`${inputClassName} pl-10`}
                  placeholder="Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </Field>

            <Field label={t("auth.emailLabel")}>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  className={`${inputClassName} pl-10`}
                  placeholder="name@example.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t("auth.stateLabel")}>
                <input
                  type="text"
                  className={inputClassName}
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </Field>

              <Field label={t("auth.passwordLabel")}>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputClassName} pl-10 pr-10`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="rounded-lg border bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
              <div className="flex gap-2">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <p className="text-xs">
                  We encrypt sensitive PII and mask Aadhaar identifiers. Searchable criteria like state remain unencrypted.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-md border bg-background p-3 text-xs leading-relaxed cursor-pointer select-none">
              <input
                type="checkbox"
                className={`${checkboxClassName} mt-0.5`}
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I consent to the collection, secure storage, and processing of my demographic data for deterministic scheme eligibility matching and recommendations.
              </span>
            </label>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              <span>{t("auth.createAccountButton")}</span>
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              {t("auth.alreadyRegistered")} {" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t("auth.signInHere")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
