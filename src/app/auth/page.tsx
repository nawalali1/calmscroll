"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const REQUIRED_MESSAGES: Record<keyof FormValues, string> = {
  firstName: "First name is required",
  lastName: "Last name is required",
  email: "Email is required",
  password: "Password is required",
};

export default function AuthPage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      if (nextValue.trim()) {
        const { [field]: _omitted, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: REQUIRED_MESSAGES[field] };
    });
  };

  const handleBlur = (field: keyof FormValues) => (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    setErrors((prev) => {
      if (!value) {
        return { ...prev, [field]: REQUIRED_MESSAGES[field] };
      }
      if (field === "email" && !isValidEmail(value)) {
        return { ...prev, email: "Enter a valid email address" };
      }
      if (field === "password" && value.length < 6) {
        return { ...prev, password: "Password must be at least 6 characters" };
      }
      const { [field]: _omitted, ...rest } = prev;
      return rest;
    });
  };

  const validate = (current: FormValues): FormErrors => {
    const nextErrors: FormErrors = {};
    (Object.keys(current) as Array<keyof FormValues>).forEach((field) => {
      const value = current[field].trim();
      if (!value) {
        nextErrors[field] = REQUIRED_MESSAGES[field];
        return;
      }
      if (field === "email" && !isValidEmail(value)) {
        nextErrors.email = "Enter a valid email address";
      }
      if (field === "password" && value.length < 6) {
        nextErrors.password = "Password must be at least 6 characters";
      }
    });
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#0B3B64_0%,#5282FF_55%,#FFB3C7_100%)] px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute bottom-[-120px] left-[-60px] h-[260px] w-[260px] rounded-full bg-white/15 blur-3xl" aria-hidden />
        <div className="absolute right-[-80px] top-[-40px] h-[280px] w-[280px] rounded-full bg-white/20 blur-3xl" aria-hidden />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 text-center text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/20 backdrop-blur-md">
          <span className="text-sm font-semibold uppercase tracking-[0.28em]">CS</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-white/85">Welcome Back</p>
        </div>

        <AuthCard className="w-full max-w-sm border-white/35 bg-white/20 px-8 py-10 shadow-[0_35px_80px_-35px_rgba(11,59,100,0.6)] backdrop-blur-md">
          <form className="flex flex-col gap-6 text-left" onSubmit={handleSubmit} noValidate>
            <header className="space-y-2 text-center text-slate-900">
              <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
              <p className="text-sm text-slate-700/80">Sign in to CalmScroll to keep your routine grounded.</p>
            </header>

            <div className="grid gap-4">
              <Input
                name="firstName"
                label="First Name"
                autoComplete="given-name"
                value={values.firstName}
                onChange={handleChange("firstName")}
                onBlur={handleBlur("firstName")}
                placeholder="Avery"
                required
                error={errors.firstName}
              />
              <Input
                name="lastName"
                label="Last Name"
                autoComplete="family-name"
                value={values.lastName}
                onChange={handleChange("lastName")}
                onBlur={handleBlur("lastName")}
                placeholder="Rivera"
                required
                error={errors.lastName}
              />
              <Input
                name="email"
                type="email"
                label="Email Address"
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={handleChange("email")}
                onBlur={handleBlur("email")}
                placeholder="you@example.com"
                required
                error={errors.email}
              />
              <Input
                name="password"
                type="password"
                label="Password"
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                placeholder="••••••••"
                minLength={6}
                required
                error={errors.password}
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} loadingText="Signing in">
              Continue
            </Button>
          </form>
        </AuthCard>

        <p className="text-sm text-white/85">
          Don&apos;t have an account?{" "}
          <Link
            href="/"
            className="font-semibold text-white transition hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Sign Up
          </Link>
        </p>
        <div data-version="login-doctor" hidden />
      </div>
    </main>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
