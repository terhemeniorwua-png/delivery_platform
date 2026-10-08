"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { safeInternalPath, homeForRole } from "@/lib/url";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isAuthenticated, loading: authLoading } = useAuth();

  const next = safeInternalPath(searchParams.get("next"), null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    router.replace(next ?? "/shop");
  }, [authLoading, isAuthenticated, next, router]);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function validate() {
    const errors = {};
    if (form.firstName.trim().length < 2) errors.firstName = "Enter your first name.";
    if (form.lastName.trim().length < 2) errors.lastName = "Enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Must be a valid email address.";
    }
    if (form.phone.trim() && !/^\+?[0-9][0-9\s-]{6,19}$/.test(form.phone.trim())) {
      errors.phone = "Must be a valid phone number.";
    }
    if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errors.password = "Password must contain a letter and a number.";
    }
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      // Backend always creates a CUSTOMER account — role is never sent.
      const user = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        password: form.password,
      });
      const target = next ?? homeForRole(user.role);
      router.replace(target);
      router.refresh();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-14 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Shop clothing, track deliveries and manage your orders.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={update("firstName")}
            error={fieldErrors.firstName}
          />
          <Input
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={update("lastName")}
            error={fieldErrors.lastName}
          />
          <div className="sm:col-span-2">
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update("email")}
              error={fieldErrors.email}
              placeholder="you@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={update("phone")}
              error={fieldErrors.phone}
              hint="Optional — helps riders reach you at delivery."
              placeholder="+234 801 234 5678"
            />
          </div>
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={update("password")}
            error={fieldErrors.password}
            hint="At least 8 characters, with a letter and a number."
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            error={fieldErrors.confirmPassword}
          />

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" fullWidth loading={submitting}>
              Create account
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
