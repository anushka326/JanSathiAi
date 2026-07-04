import { Navigate, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster } from "./components/Toaster";
import { ToastProvider } from "./hooks/useToast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Dashboard } from "./pages/Dashboard";
import { EligibilityPage } from "./pages/EligibilityPage";
import { SchemesPage } from "./pages/SchemesPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { WelcomePage } from "./pages/WelcomePage";
import { LANGUAGE_STORAGE_KEY } from "./context/LanguageContext";

function LandingRoute() {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) ? <LandingPage /> : <Navigate to="/welcome" replace />;
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthenticating } = useAuth();

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center text-xs text-muted-foreground">
        Verifying user credentials...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAuthenticating } = useAuth();

  if (isAuthenticating) {
    return (
      <div className="flex h-screen items-center justify-center text-xs text-muted-foreground">
        Verifying admin authorization...
      </div>
    );
  }

  return isAuthenticated && user?.is_admin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route index element={<LandingRoute />} />
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/schemes" element={<SchemesPage />} />

              {/* Citizen Private Routes */}
              <Route
                path="/dashboard"
                element={
                  <AuthenticatedRoute>
                    <Dashboard />
                  </AuthenticatedRoute>
                }
              />
              <Route
                path="/eligibility"
                element={
                  <AuthenticatedRoute>
                    <EligibilityPage />
                  </AuthenticatedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Catch All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
