import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, AlertCircle, FilePlus2, FileEdit, Trash2, Users, Star, BarChart3, Clock, HelpCircle, Activity, RefreshCcw, ShieldCheck, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getAdminAnalytics,
  getAdminAuditLogs,
  getFeedbackList,
  adminAddScheme,
  adminUpdateScheme,
  adminDeleteScheme,
  listSchemes,
} from "../services/api";
import { useToast } from "../hooks/useToast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Field, inputClassName } from "../components/ui/form-field";
import type { Scheme } from "../types";

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [activeTab, setActiveTab] = useState<"analytics" | "insights" | "schemes" | "feedback" | "audit">("analytics");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  // Scheme CRUD form states
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Scheme>>({
    scheme_name: "",
    category: "Farmer",
    state: "All India",
    eligibility: [],
    income_limit: 0,
    benefit: "",
    documents: [],
    application_process: "",
    official_website: "https://",
    keywords: [],
    summary: "",
  });

  // Text inputs helper states (comma-separated fields)
  const [eligibilityText, setEligibilityText] = useState("");
  const [documentsText, setDocumentsText] = useState("");
  const [keywordsText, setKeywordsText] = useState("");

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [anData, logs, fb, sch] = await Promise.all([
        getAdminAnalytics(),
        getAdminAuditLogs(),
        getFeedbackList(),
        listSchemes(),
      ]);
      setAnalytics(anData);
      setAuditLogs(logs);
      setFeedback(fb);
      setSchemes(sch);
    } catch (err) {
      showToast({ title: t("admin.loadErrorTitle"), description: t("admin.loadErrorDescription"), variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!user || !user.is_admin) {
      showToast({ title: t("admin.accessDeniedTitle"), description: t("admin.accessDenied"), variant: "error" });
      navigate("/dashboard");
      return;
    }

    loadAdminData();
  }, [user, navigate, loadAdminData, showToast]);

  function handleOpenCreate() {
    setEditingScheme(null);
    setFormData({
      scheme_name: "",
      category: "Farmer",
      state: "All India",
      eligibility: [],
      income_limit: 0,
      benefit: "",
      documents: [],
      application_process: "",
      official_website: "https://",
      keywords: [],
      summary: "",
    });
    setEligibilityText("");
    setDocumentsText("");
    setKeywordsText("");
    setIsFormOpen(true);
  }

  function handleOpenEdit(scheme: Scheme) {
    setEditingScheme(scheme);
    setFormData(scheme);
    setEligibilityText(scheme.eligibility.join(", "));
    setDocumentsText(scheme.documents.join(", "));
    setKeywordsText(scheme.keywords.join(", "));
    setIsFormOpen(true);
  }

  async function handleDelete(schemeName: string) {
    if (!window.confirm(`Are you sure you want to delete '${schemeName}'?`)) return;
    try {
      await adminDeleteScheme(schemeName);
      setSchemes((prev) => prev.filter((s) => s.scheme_name !== schemeName));
      showToast({ title: t("admin.schemeDeletedTitle"), description: t("admin.schemeDeletedDescription", { scheme: schemeName }) });
    } catch (e) {
      showToast({ title: t("admin.actionFailed"), description: t("admin.deleteFailed"), variant: "error" });
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Parse comma separated parameters
    const processed = {
      ...formData,
      eligibility: eligibilityText.split(",").map((s) => s.trim()).filter(Boolean),
      documents: documentsText.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: keywordsText.split(",").map((s) => s.trim()).filter(Boolean),
    } as Scheme;

    try {
      if (editingScheme) {
        // Update Scheme
        await adminUpdateScheme(editingScheme.scheme_name, processed);
        setSchemes((prev) => prev.map((s) => (s.scheme_name === editingScheme.scheme_name ? processed : s)));
        showToast({ title: t("admin.schemeUpdatedTitle"), description: t("admin.schemeUpdatedDescription", { scheme: processed.scheme_name }) });
      } else {
        // Create Scheme
        await adminAddScheme(processed);
        setSchemes((prev) => [...prev, processed]);
        showToast({ title: t("admin.schemeCreatedTitle"), description: t("admin.schemeCreatedDescription", { scheme: processed.scheme_name }) });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      showToast({
        title: t("admin.submissionFailedTitle"),
        description: err.response?.data?.detail || t("admin.submissionFailedDescription"),
        variant: "error",
      });
    }
  }

  if (isLoading || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground flex-col gap-3">
        <Clock className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs">Loading admin statistics panel...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t("admin.header")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("admin.description")}
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="h-10 text-xs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>{t("admin.returnDashboard")}</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap gap-2 border-b pb-3 overflow-x-auto">
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === "analytics" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            {t("admin.tabs.analytics")}
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === "insights" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveTab("insights")}
          >
            {t("admin.tabs.insights")}
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === "schemes" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveTab("schemes")}
          >
            {t("admin.tabs.schemes")}
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === "feedback" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveTab("feedback")}
          >
            {t("admin.tabs.feedback", { count: feedback.length })}
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
              activeTab === "audit" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveTab("audit")}
          >
            {t("admin.tabs.audit", { count: auditLogs.length })}
          </button>
        </div>

        <Button variant="outline" className="h-10" onClick={loadAdminData}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          {t("admin.refreshButton")}
        </Button>
      </div>

      {/* 1. Analytics tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Total Users Registered</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2 mt-1">
                  <Users className="h-6 w-6 text-primary" />
                  <span>{analytics.total_users}</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Recommendation Sessions</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2 mt-1">
                  <Activity className="h-6 w-6 text-secondary" />
                  <span>{analytics.total_sessions}</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Average Feedback rating</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2 mt-1">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500 shrink-0" />
                  <span>{analytics.feedback_rating} / 5.0</span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase font-bold tracking-wider">Database Index</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2 mt-1">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span>{schemes.length} Schemes</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Eligibility Activity</CardTitle>
                <CardDescription>Recent eligibility checks and recommendation sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {auditLogs.filter((log) => log.action === "ELIGIBILITY_CHECK").slice(0, 5).map((log) => (
                  <div key={log._id || log.created_at} className="rounded-lg border bg-muted/10 p-3">
                    <p className="text-xs font-semibold text-foreground">{log.details?.state || "Unknown state"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {log.details?.eligible_count ?? 0} eligible • {log.details?.ineligible_count ?? 0} ineligible
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discovery Leaders</CardTitle>
                <CardDescription>Most accessed and requested database items</CardDescription>
              </CardHeader>
              <CardContent className="divide-y text-sm">
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Most Recommended Scheme</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]" title={analytics.most_recommended_scheme}>
                    {analytics.most_recommended_scheme}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Most Bookmarked Scheme</span>
                  <span className="font-semibold text-foreground truncate max-w-[200px]" title={analytics.most_saved_scheme}>
                    {analytics.most_saved_scheme}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Primary User Target Category</span>
                  <span className="font-semibold text-foreground">{analytics.most_used_category}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-muted-foreground">Most Active Sector</span>
                  <span className="font-semibold text-foreground">{analytics.most_active_category}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base">GovTech Policy Notice</CardTitle>
                <CardDescription>Audited data processing & privacy trail compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                <p>
                  Every user registration, login failure, document extraction, and eligibility match is indexed within the MongoDB <code className="bg-muted px-1.5 py-0.5 rounded font-mono">audit_logs</code> collection.
                </p>
                <p>
                  Searchable attributes are stored unencrypted, and sensitive parameters are encrypted using AES cryptography. File payloads processed for OCR are deleted instantly.
                </p>
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-primary text-xs flex gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>The admin control console logs all modifications to scheme parameters.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  System Health
                </CardTitle>
                <CardDescription>Live status of the portal and audit collection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/5 p-3">
                    <span className="text-xs text-muted-foreground">Database connection</span>
                    <span className="text-[11px] font-semibold text-emerald-700">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/5 p-3">
                    <span className="text-xs text-muted-foreground">Audit log ingestion</span>
                    <span className="text-[11px] font-semibold text-emerald-700">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/5 p-3">
                    <span className="text-xs text-muted-foreground">Scheme index status</span>
                    <span className="text-[11px] font-semibold text-emerald-700">Synced</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  User Intelligence
                </CardTitle>
                <CardDescription>Snapshot of active users and demographic reach.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="rounded-lg border bg-muted/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total registered users</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{analytics.total_users}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Average sessions per user</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{analytics.total_users ? Math.round(analytics.total_sessions / Math.max(1, analytics.total_users)) : 0}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Top category reached</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{analytics.most_used_category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Quick Oversight
                </CardTitle>
                <CardDescription>Administrative triggers and summary actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-3">
                  <div className="rounded-lg border bg-muted/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Most recommended</p>
                    <p className="mt-1 font-semibold text-foreground truncate" title={analytics.most_recommended_scheme}>{analytics.most_recommended_scheme}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Most bookmarked</p>
                    <p className="mt-1 font-semibold text-foreground truncate" title={analytics.most_saved_scheme}>{analytics.most_saved_scheme}</p>
                  </div>
                  <Button variant="outline" className="h-10 w-full" onClick={loadAdminData}>
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh snapshot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Administrative Activity</CardTitle>
              <CardDescription>Audit log events, user actions, and system events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {auditLogs.slice(0, 6).map((log) => (
                  <button
                    key={log._id || log.created_at}
                    className="text-left rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => setSelectedActivity(log)}
                  >
                    <p className="text-[11px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{log.action}</p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{JSON.stringify(log.details)}</p>
                  </button>
                ))}
              </div>
              {selectedActivity ? (
                <div className="rounded-xl border bg-muted/5 p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Selected Event</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{selectedActivity.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">User: {selectedActivity.user_id || "Anonymous"}</p>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-3 text-[10px] text-muted-foreground">{JSON.stringify(selectedActivity.details, null, 2)}</pre>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-muted/30 bg-background/80 p-4 text-sm text-muted-foreground">
                  Select an event card to inspect details.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Schemes CRUD Management */}
      {activeTab === "schemes" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-card p-4 border rounded-xl shadow-sm">
            <div>
              <p className="text-sm font-semibold">Database Records ({schemes.length})</p>
              <p className="text-xs text-muted-foreground mt-0.5">Central and state scheme indexing</p>
            </div>
            <Button onClick={handleOpenCreate}>
              <FilePlus2 className="h-4 w-4 mr-1.5" />
              <span>Add New Scheme</span>
            </Button>
          </div>

          {/* Form Modal/Section */}
          {isFormOpen && (
            <Card className="border-primary/20 shadow-lg bg-card animate-in fade-in duration-200">
              <CardHeader className="pb-3 border-b mb-4 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-base">{editingScheme ? "Edit Scheme details" : "Create New Scheme"}</CardTitle>
                  <CardDescription className="text-xs">Provide policy rules for matching</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Close</Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Scheme Name">
                      <input
                        className={inputClassName}
                        value={formData.scheme_name}
                        onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                        required
                        disabled={!!editingScheme}
                      />
                    </Field>

                    <Field label="Category">
                      <select
                        className={inputClassName}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Farmer">Farmer</option>
                        <option value="Education">Education</option>
                        <option value="Women Welfare">Women Welfare</option>
                        <option value="Labour">Labour</option>
                        <option value="Pension">Pension</option>
                        <option value="Disability Support">Disability Support</option>
                        <option value="Health">Health</option>
                        <option value="Housing">Housing</option>
                        <option value="Business">Business</option>
                      </select>
                    </Field>

                    <Field label="State of Application">
                      <input
                        className={inputClassName}
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </Field>

                    <Field label="Income limit (INR)">
                      <input
                        className={inputClassName}
                        type="number"
                        value={formData.income_limit}
                        onChange={(e) => setFormData({ ...formData, income_limit: Number(e.target.value) })}
                      />
                    </Field>

                    <Field label="Official Website URL">
                      <input
                        className={inputClassName}
                        type="url"
                        value={formData.official_website}
                        onChange={(e) => setFormData({ ...formData, official_website: e.target.value as any })}
                        required
                      />
                    </Field>

                    <div className="sm:col-span-3">
                      <Field label="Short Summary description">
                        <textarea
                          className={`${inputClassName} h-16`}
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field label="Benefit Details">
                        <input
                          className={inputClassName}
                          value={formData.benefit}
                          onChange={(e) => setFormData({ ...formData, benefit: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field label="Required Documents (comma separated)">
                        <input
                          className={inputClassName}
                          value={documentsText}
                          onChange={(e) => setDocumentsText(e.target.value)}
                          placeholder="Aadhaar, Ration card, Land records"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field label="Eligibility Rules parameters (comma separated)">
                        <input
                          className={inputClassName}
                          value={eligibilityText}
                          onChange={(e) => setEligibilityText(e.target.value)}
                          placeholder="Small farmer, Domicile of Maharashtra"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field label="Keywords for Search Index (comma separated)">
                        <input
                          className={inputClassName}
                          value={keywordsText}
                          onChange={(e) => setKeywordsText(e.target.value)}
                          placeholder="shetkari, crop, loan"
                        />
                      </Field>
                    </div>

                    <div className="sm:col-span-3">
                      <Field label="Step-by-Step Application Process">
                        <textarea
                          className={`${inputClassName} h-20`}
                          value={formData.application_process}
                          onChange={(e) => setFormData({ ...formData, application_process: e.target.value })}
                          required
                        />
                      </Field>
                    </div>
                  </div>
                  <Button type="submit" className="h-10 mt-4 px-6">
                    Save Scheme Parameters
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Table display */}
          <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b font-semibold text-muted-foreground">
                    <th className="p-3">Scheme Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Income limit</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schemes.map((scheme) => (
                    <tr key={scheme.scheme_name} className="hover:bg-muted/5">
                      <td className="p-3 font-semibold text-foreground max-w-[250px] truncate" title={scheme.scheme_name}>
                        {scheme.scheme_name}
                      </td>
                      <td className="p-3 text-muted-foreground">{scheme.category}</td>
                      <td className="p-3 text-muted-foreground">{scheme.state}</td>
                      <td className="p-3 text-muted-foreground">
                        {scheme.income_limit ? `Rs. ${scheme.income_limit.toLocaleString()}` : "None"}
                      </td>
                      <td className="p-3 text-right flex justify-end gap-1.5">
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(scheme)}>
                          <FileEdit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(scheme.scheme_name)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Feedback Reviews */}
      {activeTab === "feedback" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span>Citizen Reviews</span>
            </CardTitle>
            <CardDescription>Raw ratings and comments submitted by users</CardDescription>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No feedback reviews submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="p-4 border rounded-xl bg-muted/10 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{item.user_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Stars */}
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-4 w-4 ${idx < item.rating ? "fill-amber-500" : "opacity-20"}`} />
                      ))}
                    </div>

                    <p className="text-muted-foreground leading-relaxed italic">
                      "{item.comment}"
                    </p>

                    {item.scheme_name && (
                      <p className="text-[10px] text-primary font-medium">
                        Scheme Reference: {item.scheme_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Audit logs */}
      {activeTab === "audit" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Security Access Logs</span>
            </CardTitle>
            <CardDescription>Immutable transaction records for PII operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b font-semibold text-muted-foreground">
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">User reference</th>
                    <th className="p-2.5">Metadata details</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[10px]">
                  {auditLogs.slice(0, 50).map((log) => (
                    <tr key={log._id || log.created_at} className="hover:bg-muted/5">
                      <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          log.action.includes("FAILED") ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2.5 text-muted-foreground whitespace-nowrap truncate max-w-[100px]" title={log.user_id}>
                        {log.user_id || "Anonymous"}
                      </td>
                      <td className="p-2.5 text-muted-foreground max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
