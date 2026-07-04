import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Landmark, Loader2, Lock, Mail } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { LANGUAGE_STORAGE_KEY, useLanguage, type Language } from "../context/LanguageContext";
import { useToast } from "../hooks/useToast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Field, inputClassName } from "../components/ui/form-field";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const { setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showToast({ title: t("auth.loginValidationError"), description: t("auth.loginValidationError"), variant: "error" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await login(email, password);
      const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage === "en" || storedLanguage === "hi" || storedLanguage === "mr") {
        setLanguage(storedLanguage as Language);
      }
      showToast({ title: t("auth.loginSuccess"), description: t("auth.loginSuccess") });
      navigate("/dashboard");
    } catch (err: any) {
      showToast({
        title: t("auth.loginFailed"),
        description: err.response?.data?.detail || t("auth.loginFailedFallback"),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-6 w-6" />
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label={t("auth.emailLabel")}>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  className={`${inputClassName} pl-10`}
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </Field>

            <Field label={t("auth.passwordLabel")}>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${inputClassName} pl-10 pr-10`}
                  placeholder={t("auth.passwordPlaceholder")}
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

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              <span>{t("auth.signInButton")}</span>
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              {t("auth.noAccount")} {" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                {t("auth.registerLink")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
