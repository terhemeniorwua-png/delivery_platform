"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { safeInternalPath, homeForRole } from "@/lib/url";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const rawNext = safeInternalPath(searchParams.get("next"), null);
  // never bounce back to an auth screen (prevents redirect loops)
  const next =
    rawNext && !rawNext.startsWith("/login") && !rawNext.startsWith("/register") ? rawNext : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Already signed in → leave the auth screen immediately.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    router.replace(next ?? "/shop");
  }, [authLoading, isAuthenticated, next, router]);

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    const errors = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    if (!password) errors.password = "Enter your password.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const target = next ?? homeForRole(user.role);
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to keep shopping and track your orders.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            placeholder="Your password"
          />

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link
            href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
