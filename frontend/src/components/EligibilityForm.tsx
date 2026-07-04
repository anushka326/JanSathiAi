import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { checkEligibility, uploadDocumentOCR } from "../services/api";
import type { EligibilityRequest, EligibilityResponse, UserProfile } from "../types";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Field, checkboxClassName, inputClassName } from "./ui/form-field";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required to run eligibility checks." }),
  }),
  age: z.coerce.number().int().min(0, "Age must be positive").max(120),
  gender: z.enum(["female", "male", "other", "prefer_not_to_say"]),
  occupation: z.string().min(2, "Occupation is required").max(80),
  income: z.coerce.number().int().min(0, "Income must be positive"),
  state: z.string().min(2, "State of residence is required").max(80),
  disability_status: z.boolean(),
  category: z.enum(["General", "OBC", "SC", "ST", "EWS"]),
  student_status: z.boolean(),
  farmer_status: z.boolean(),
  employment_status: z.enum(["employed", "self_employed", "unemployed", "student", "retired"]),
  has_pucca_house: z.boolean(),
  rural_resident: z.boolean(),
  has_bank_account: z.boolean(),
});

const emptyDefaults: EligibilityRequest = {
  name: "",
  consent: true,
  age: 18,
  gender: "prefer_not_to_say",
  occupation: "",
  income: 0,
  state: "",
  disability_status: false,
  category: "General",
  student_status: false,
  farmer_status: false,
  employment_status: "unemployed",
  has_pucca_house: false,
  rural_resident: false,
  has_bank_account: true,
};

interface Props {
  onResult: (result: EligibilityResponse) => void;
}

export function EligibilityForm({ onResult }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EligibilityRequest>({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  useEffect(() => {
    const profile = user?.profile as UserProfile | undefined;
    const seededValues: EligibilityRequest = {
      name: profile?.name || "",
      consent: profile?.consent ?? true,
      age: profile?.age ?? 18,
      gender: profile?.gender || "prefer_not_to_say",
      occupation: profile?.occupation || "",
      income: profile?.income ?? 0,
      state: profile?.state || user?.state || "",
      disability_status: profile?.disability_status ?? false,
      category: profile?.category || "General",
      student_status: profile?.student_status ?? false,
      farmer_status: profile?.farmer_status ?? false,
      employment_status: profile?.employment_status || "unemployed",
      has_pucca_house: profile?.has_pucca_house ?? false,
      rural_resident: profile?.rural_resident ?? false,
      has_bank_account: profile?.has_bank_account ?? true,
    };

    reset(seededValues);
  }, [user, reset]);

  const booleanFields = useMemo(
    () => [
      { name: "student_status" },
      { name: "farmer_status" },
      { name: "disability_status" },
      { name: "rural_resident" },
      { name: "has_pucca_house" },
      { name: "has_bank_account" },
    ] as const,
    [],
  );

  async function handleOcrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("consent", "true");

    try {
      const response = await uploadDocumentOCR(formData);
      if (response.status === "success") {
        const details = response.data;
        showToast({
          title: "OCR Scan Completed",
          description: `Extracted data for ${details.name || "citizen"} with confidence ${Math.round(details.confidence_score * 100)}%`,
        });
        
        // Auto-fill values
        if (details.name) setValue("name", details.name);
        if (details.age) setValue("age", details.age);
        if (details.gender) setValue("gender", details.gender);
        if (details.occupation) setValue("occupation", details.occupation);
        if (details.income) setValue("income", details.income);
        if (details.state) setValue("state", details.state);
        if (details.category) setValue("category", details.category);
        if (details.disability_status !== undefined) setValue("disability_status", details.disability_status);
      }
    } catch (error: any) {
      showToast({
        title: "OCR Processing Failed",
        description: error.response?.data?.detail || "Please verify the document format is valid.",
        variant: "error",
      });
    } finally {
      setOcrLoading(false);
    }
  }

  async function onSubmit(values: EligibilityRequest) {
    setIsSubmitting(true);
    try {
      const result = await checkEligibility(values);
      onResult(result);
      showToast({
        title: "Eligibility Match Successful",
        description: `${result.eligible_schemes.length} eligible government schemes mapped.`,
      });
    } catch (error: any) {
      showToast({
        title: "Eligibility Check Failed",
        description: error.response?.data?.detail || error.message || "Server error.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-soft border-primary/20">
      <CardHeader className="pb-3 border-b mb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <CardTitle className="text-lg">{t("eligibility.formTitle")}</CardTitle>
            <CardDescription className="text-xs">{t("eligibility.formDescription")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Step 1: Document upload hub */}
        <div className="rounded-xl border border-dashed border-primary/30 p-4 bg-primary/5 text-center">
          <FileUp className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-xs font-semibold text-primary">{t("eligibility.uploadTitle")}</p>
          <p className="text-[10px] text-muted-foreground mt-1 mb-3">
            {t("eligibility.uploadText")}
          </p>
          <label className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/95 cursor-pointer">
            {ocrLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            <span>{ocrLoading ? t("eligibility.uploadScanning") : t("eligibility.uploadButton")}</span>
            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleOcrUpload} disabled={ocrLoading} />
          </label>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t("eligibility.nameLabel")} error={errors.name?.message}>
                <input className={inputClassName} type="text" placeholder={t("eligibility.nameLabel")} {...register("name")} />
              </Field>
            </div>

            <Field label={t("eligibility.ageLabel")} error={errors.age?.message}>
              <input className={inputClassName} type="number" min={0} max={120} placeholder="18" {...register("age")} />
            </Field>

            <Field label={t("eligibility.incomeLabel")} error={errors.income?.message}>
              <input className={inputClassName} type="number" min={0} placeholder={t("eligibility.incomeLabel")} {...register("income")} />
            </Field>

            <Field label={t("eligibility.genderLabel")} error={errors.gender?.message}>
              <select className={inputClassName} {...register("gender")}>
                <option value="female">{t("common.genderOptions.female")}</option>
                <option value="male">{t("common.genderOptions.male")}</option>
                <option value="other">{t("common.genderOptions.other")}</option>
                <option value="prefer_not_to_say">{t("common.genderOptions.prefer_not_to_say")}</option>
              </select>
            </Field>

            <Field label={t("eligibility.categoryLabel")} error={errors.category?.message}>
              <select className={inputClassName} {...register("category")}> 
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </Field>

            <Field label={t("eligibility.occupationLabel")} error={errors.occupation?.message}>
              <input className={inputClassName} placeholder={t("eligibility.occupationLabel")} {...register("occupation")} />
            </Field>

            <Field label={t("eligibility.stateLabel")} error={errors.state?.message}>
              <input className={inputClassName} placeholder={t("eligibility.stateLabel")} {...register("state")} />
            </Field>

            <div className="sm:col-span-2">
              <Field label={t("eligibility.employmentLabel")} error={errors.employment_status?.message}>
                <select className={inputClassName} {...register("employment_status")}>
                  <option value="employed">{t("common.employmentOptions.employed")}</option>
                  <option value="self_employed">{t("common.employmentOptions.self_employed")}</option>
                  <option value="unemployed">{t("common.employmentOptions.unemployed")}</option>
                  <option value="student">{t("common.employmentOptions.student")}</option>
                  <option value="retired">{t("common.employmentOptions.retired")}</option>
                </select>
              </Field>
            </div>
          </div>

          <fieldset className="space-y-2 border-t pt-3">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("eligibility.demographicFlags")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {booleanFields.map((field) => (
                <label key={field.name} className="flex h-10 items-center gap-2 rounded-lg border bg-background px-3 text-xs cursor-pointer select-none">
                  <input type="checkbox" className={checkboxClassName} {...register(field.name)} />
                  <span>{t(`eligibility.${field.name}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="border-t pt-3 space-y-3">
            <label className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed cursor-pointer select-none">
              <input type="checkbox" className={`${checkboxClassName} mt-0.5`} {...register("consent")} />
              <span className="text-[11px] text-muted-foreground">
                {t("eligibility.consentLabel")}
              </span>
            </label>
            {errors.consent?.message && (
              <p className="text-xs text-destructive mt-1">{errors.consent.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            <span>{isSubmitting ? t("eligibility.submitLoading") : t("eligibility.submitButton")}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
