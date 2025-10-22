"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginHardFix() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [vals, setVals] = React.useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errs, setErrs] = React.useState<{ [k: string]: string }>({});

  const handleChange = (key: keyof typeof vals) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setVals((prev) => ({ ...prev, [key]: value }));
  };

  const requiredOnly = () => {
    const nextErrs: { [k: string]: string } = {};
    (Object.keys(vals) as Array<keyof typeof vals>).forEach((k) => {
      if (!String(vals[k]).trim()) {
        nextErrs[k] = "Required";
      }
    });
    setErrs(nextErrs);
    return Object.keys(nextErrs).length === 0;
  };

  const navigateHome = async () => {
    console.log("[login] navigateHome start");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("calmscroll_session", "1");
      }
      console.log("[login] router.push('/') attempt");
      router.push("/");
      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          console.log("[login] hard fallback window.location.assign('/')");
          window.location.assign("/");
        }
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setAttribute("data-submit-fired", "true");
    console.log("[login] submit fired", { vals });
    if (!requiredOnly()) {
      console.log("[login] required validation failed");
      return;
    }
    await navigateHome();
  };

  const handleClickBackup = async () => {
    console.log("[login] backup click fired");
    if (!requiredOnly()) return;
    await navigateHome();
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0B3B64] via-[#5282FF] to-[#FFB3C7]"
      data-version="login-fixed-session"
    >
      <div className="w-full max-w-sm space-y-4">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/30 backdrop-blur" aria-hidden />
        <h1 className="text-center text-2xl font-semibold text-white">Welcome Back</h1>

        <form onSubmit={handleSubmit} noValidate className="rounded-3xl bg-white/20 backdrop-blur-md p-6 space-y-4">
          {(["firstName", "lastName", "email", "password"] as const).map((name) => (
            <div key={name} className="text-white">
              <label htmlFor={name} className="block text-sm mb-1 capitalize">
                {name.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                id={name}
                name={name}
                type={name === "password" ? "password" : name === "email" ? "email" : "text"}
                className="w-full rounded-xl px-3 py-2 text-black"
                value={vals[name]}
                onChange={handleChange(name)}
                aria-invalid={errs[name] ? "true" : "false"}
                aria-describedby={errs[name] ? `${name}-error` : undefined}
              />
              {errs[name] ? (
                <p id={`${name}-error`} className="text-xs text-red-200 mt-1">
                  {errs[name]}
                </p>
              ) : null}
            </div>
          ))}

          <button
            type="submit"
            onClick={handleClickBackup}
            disabled={loading}
            className="w-full rounded-2xl bg-white text-[#0B3B64] font-semibold py-3 hover:bg-white/90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            data-push-attempt={loading ? "in-progress" : "idle"}
          >
            {loading ? "Loading..." : "Continue"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/90">
          Don’t have an account?{" "}
          <Link className="underline font-semibold" href="/">
            Skip to Home (debug)
          </Link>
        </p>
        <div data-version="login-fixed-session" hidden />
      </div>
    </main>
  );
}
