"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassyCard from "@/components/GlassyCard";

const FIELDS = [
  { id: "firstName", label: "First Name", type: "text", autoComplete: "given-name", placeholder: "First name" },
  { id: "lastName", label: "Last Name", type: "text", autoComplete: "family-name", placeholder: "Last name" },
  { id: "email", label: "Email Address", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { id: "password", label: "Password", type: "password", autoComplete: "current-password", placeholder: "••••••••" },
] as const;

const INITIAL_VALUES = Object.fromEntries(FIELDS.map(({ id }) => [id, ""])) as Record<(typeof FIELDS)[number]["id"], string>;

type FieldId = keyof typeof INITIAL_VALUES;

export default function LoginPage() {
  const router = useRouter();
  const [values, setValues] = React.useState(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<Record<FieldId, string>>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const validate = React.useCallback((field: FieldId, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Required";
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email";
    if (field === "password" && trimmed.length < 6) return "Minimum 6 characters";
    return "";
  }, []);

  const handleChange = (field: FieldId) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value;
    setValues((prev) => ({ ...prev, [field]: next }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, next) }));
    }
  };

  const handleBlur = (field: FieldId) => (event: React.FocusEvent<HTMLInputElement>) => {
    setErrors((prev) => ({ ...prev, [field]: validate(field, event.currentTarget.value) }));
  };

  const allValid = React.useMemo(
    () => (Object.keys(values) as FieldId[]).every((field) => !validate(field, values[field])),
    [validate, values]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = Object.fromEntries(
      (Object.keys(values) as FieldId[]).map((field) => [field, validate(field, values[field])])
    ) as Record<FieldId, string>;
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (typeof window !== "undefined") {
        window.localStorage.setItem("calmscroll_session", "1");
      }
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#3b4fff] via-[#6c5bff] to-[#ff80b5] py-10">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-white/20 blur-3xl" aria-hidden />
        <div className="absolute right-16 top-10 h-32 w-32 rounded-full bg-indigo-200/40 blur-3xl" aria-hidden />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
            <span className="text-xl font-semibold">~</span>
          </div>
        </div>

        <GlassyCard className={`p-8 text-slate-900 dark:text-white ${prefersReducedMotion ? "" : "transition duration-300"}`}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Enter your CalmScroll details to continue.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {FIELDS.map((field) => (
              <label key={field.id} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {field.label}
                <input
                  type={field.type}
                  name={field.id}
                  autoComplete={field.autoComplete}
                  value={values[field.id]}
                  onChange={handleChange(field.id)}
                  onBlur={handleBlur(field.id)}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-full border border-white/60 bg-white/95 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
                {errors[field.id] ? (
                  <span className="mt-1 block text-xs text-rose-500" role="alert">
                    {errors[field.id]}
                  </span>
                ) : null}
              </label>
            ))}

            <button
              type="submit"
              disabled={isSubmitting || !allValid}
              className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-pink-500 py-3 text-sm font-semibold text-white shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Continue"}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-300">
              By continuing you agree to our {" "}
              <Link href="/terms" className="underline">
                Terms
              </Link>{" "}
              and {" "}
              <Link href="/privacy" className="underline">
                Privacy
              </Link>
              .
            </p>
          </form>
        </GlassyCard>

        <p className="mt-6 text-center text-sm text-white/85">
          Don&apos;t have an account?{" "}
          <Link href="/" className="font-semibold underline">
            Sign Up
          </Link>
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0" aria-hidden>
        <svg viewBox="0 0 375 120" xmlns="http://www.w3.org/2000/svg" className="h-24 w-full text-white/40">
          <path
            fill="currentColor"
            d="M0 60c30 18 90 48 150 42s120-54 180-60 96 30 96 30v48H0V60z"
          />
        </svg>
      </div>
    </div>
  );
}
