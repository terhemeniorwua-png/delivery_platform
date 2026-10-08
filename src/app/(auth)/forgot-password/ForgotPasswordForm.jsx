"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import Logo from "@/components/branding/Logo";

const CODE_RE = /^\d{6}$/;

const STEP_COPY = {
  email: {
    hint: "Enter the email on your account and we\u2019ll send a 6-digit reset code.",
    submit: "Send reset code",
  },
  code: {
    hint: "Enter the 6-digit code we sent. If it\u2019s correct you\u2019ll be taken to the reset form.",
    submit: "Verify code",
  },
  reset: {
    hint: "Code verified. Choose a new password for your account.",
    submit: "Reset password",
  },
};

/**
 * Password-reset flow backed by the public endpoints:
 *   POST /auth/forgot-password  (step: email)
 *   POST /auth/verify-code      (step: code)   <- dedicated verification form
 *   POST /auth/reset-password   (step: reset)
 *
 * The plain demo code is returned by forgot-password (no mailer yet) and is
 * shown in an alert box so the flow can be completed.
 */
export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [codeNotice, setCodeNotice] = useState(null);

  function resetError() {
    setError(null);
    setFieldErrors({});
  }

  async function requestCode(targetEmail) {
    resetError();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail.trim())) {
      setFieldErrors({ email: "Must be a valid email address." });
      return;
    }
    setSubmitting(true);
    setCode("");
    setCodeNotice(null);
    try {
      const data = await api.post("/auth/forgot-password", { email: targetEmail.trim() }, { auth: false });
      setCodeNotice({ code: data.code, email: data.email, expiresAt: data.expiresAt });
      setStep("code");
      toast("Reset code sent", { type: "success" });
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast(message, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    resetError();

    if (step === "email") {
      await requestCode(email);
      return;
    }

    if (step === "code") {
      if (!CODE_RE.test(code.trim())) {
        setFieldErrors({ code: "Enter the 6-digit code." });
        return;
      }
      setSubmitting(true);
      try {
        await api.post("/auth/verify-code", { email: email.trim(), code: code.trim() }, { auth: false });
        setStep("reset");
        toast("Code verified — set a new password.", { type: "success" });
      } catch (err) {
        const message = getApiErrorMessage(err);
        setError(message);
        toast(message, { type: "error" });
        setCode(""); // unsuccessful attempt -> enter the code again
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // step === "reset"
    const errors = {};
    if (!newPassword) errors.newPassword = "Enter a new password.";
    else if (!/^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$/.test(newPassword)) {
      errors.newPassword = "At least 8 characters with a letter and a number.";
    }
    if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(
        "/auth/reset-password",
        { email: email.trim(), code: code.trim(), newPassword },
        { auth: false }
      );
      toast("Password reset successfully. Sign in with your new password.", { type: "success" });
      router.replace("/login");
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast(message, { type: "error" });
      if (/(code|expired|verification|incorrect)/i.test(message)) {
        setStep("code");
        setCode(""); // code no longer usable -> verify again
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-8 flex justify-center">
        <Logo size={46} />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">{STEP_COPY[step].hint}</p>

        {codeNotice && step !== "email" ? (
          <div role="alert" className="mt-6 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3">
            <p className="font-medium text-warning">Your verification code</p>
            <p
              className="mt-1 font-mono text-3xl font-semibold tracking-[0.3em] text-ink"
              aria-label={`Verification code ${codeNotice.code}`}
            >
              {codeNotice.code}
            </p>
            <p className="mt-1 text-xs text-muted">
              No email is sent in this demo — write it down. It expires in 15 minutes.
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {step === "email" ? (
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
          ) : null}

          {step === "code" ? (
            <>
              <Input
                label="Verification code"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                error={fieldErrors.code}
                placeholder="6-digit code"
              />
            </>
          ) : null}

          {step === "reset" ? (
            <>
              <Input
                label="New password"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={fieldErrors.newPassword}
                placeholder="At least 8 characters with a letter and a number"
              />
              <Input
                label="Confirm new password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={fieldErrors.confirmPassword}
                placeholder="Repeat the new password"
              />
            </>
          ) : null}

          {step !== "email" ? (
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => requestCode(email)}
                disabled={submitting}
                className="font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  resetError();
                  setCodeNotice(null);
                  setStep("email");
                  setCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-muted transition-colors hover:text-ink"
              >
                Use a different email
              </button>
            </div>
          ) : null}

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {STEP_COPY[step].submit}
          </Button>
        </form>

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