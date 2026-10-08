"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Forgot-password UI (connected from the login form).
 *
 * The backend exposes no password-reset endpoint yet, so this is a UI-only
 * flow: submitting shows a generic confirmation and never reveals whether the
 * email exists. Wire it to a reset endpoint when one is added.
 */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [fieldError, setFieldError] = useState(null);

  function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("Must be a valid email address.");
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    // No backend call yet (UI-only). Simulate a brief request so the button
    // state is consistent with the other auth forms.
    setTimeout(() => {
      setSent(true);
      setSubmitting(false);
    }, 400);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          Enter the email on your account and we&apos;ll send reset instructions.
        </p>

        {sent ? (
          <div
            role="status"
            className="mt-6 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm"
          >
            <p className="font-medium text-success">Check your inbox</p>
            <p className="mt-1 text-muted">
              If an account exists for <span className="font-medium text-ink">{email.trim()}</span>,
              password reset instructions are on their way.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldError}
              placeholder="you@example.com"
            />
            <Button type="submit" size="lg" fullWidth loading={submitting}>
              Send reset instructions
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}