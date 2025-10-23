"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[linear-gradient(165deg,#0B3B64_0%,#365DFF_55%,#FF8CC4_100%)] px-4 py-10 text-white">
      <div className="absolute inset-0">
        <div className="absolute left-[-8%] top-[-12%] h-60 w-60 rounded-full bg-[#7EA7FF]/25 blur-3xl" aria-hidden />
        <div className="absolute right-[-12%] top-[18%] h-52 w-52 rounded-full bg-[#B38BFF]/25 blur-3xl" aria-hidden />
        <div className="absolute right-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-[#FF8CC4]/30 blur-[110px]" aria-hidden />
      </div>

      <div className={`relative w-full max-w-sm ${prefersReducedMotion ? "" : "transition duration-500"}`}>
        <div className="absolute inset-0 -translate-y-6 rounded-[38px] bg-[radial-gradient(circle_at_top,#ffffff40,transparent_60%)] blur-2xl opacity-70" aria-hidden />
        <div className="relative rounded-[38px] border border-white/20 bg-white/15 px-8 py-12 shadow-[0_45px_80px_-35px_rgba(12,34,89,0.65)] backdrop-blur-[28px]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/25 text-white shadow-inner shadow-white/10">
            <svg viewBox="0 0 48 48" className="h-8 w-8 opacity-90" aria-hidden>
              <path
                d="M6 18c6 0 6 12 12 12s6-12 12-12 6 12 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="mt-8 text-center text-3xl font-semibold tracking-tight text-white">Welcome Back</h1>
          <p className="mt-2 text-center text-sm text-white/80">
            Sign in to continue your calming streak.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
            {FIELDS.map((field) => (
              <label key={field.id} className="block text-sm font-medium uppercase tracking-[0.28em] text-white/70">
                <span>{field.label}</span>
                <input
                  type={field.type}
                  name={field.id}
                  autoComplete={field.autoComplete}
                  value={values[field.id]}
                  onChange={handleChange(field.id)}
                  onBlur={handleBlur(field.id)}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-full border border-white/35 bg-white/10 px-5 py-3 text-sm font-medium text-white placeholder-white/60 shadow-inner shadow-white/10 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                {errors[field.id] ? (
                  <span className="mt-1 block text-xs font-semibold text-rose-200" role="alert">
                    {errors[field.id]}
                  </span>
                ) : null}
              </label>
            ))}

            <button
              type="submit"
              disabled={isSubmitting || !allValid}
              className="w-full rounded-full bg-gradient-to-r from-[#7EA7FF] via-[#9C8BFF] to-[#FF8DC5] py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_40px_-28px_rgba(9,32,86,0.8)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Continue"}
            </button>

            <p className="text-center text-xs text-white/70">
              By continuing you agree to our{" "}
              <Link href="/terms" className="font-semibold text-white underline underline-offset-4">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-white underline underline-offset-4">
                Privacy
              </Link>
              .
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-white/85">
            Don&apos;t have an account?{" "}
            <Link href="/" className="font-semibold underline underline-offset-4">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0" aria-hidden>
        <svg viewBox="0 0 375 120" xmlns="http://www.w3.org/2000/svg" className="h-28 w-full text-white/30">
          <path
            fill="currentColor"
            d="M0 60c30 18 90 48 150 42s120-54 180-60 96 30 96 30v48H0V60z"
          />
        </svg>
      </div>
    </div>
  );
}
