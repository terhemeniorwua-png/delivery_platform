"use client";

import { useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const EMPTY = {
  label: "",
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  country: "Nigeria",
  postalCode: "",
  isDefault: false,
};

/**
 * New-address form (POST /api/addresses) used from the checkout address
 * book. Field rules mirror the backend zod schema — the server remains the
 * authority and its errors surface inline.
 */
export default function AddressForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  function update(field) {
    return (event) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function validate() {
    const errors = {};
    if (form.recipientName.trim().length < 2) errors.recipientName = "Enter the recipient's name.";
    if (!/^\+?[0-9][0-9\s-]{6,19}$/.test(form.phone.trim())) {
      errors.phone = "Must be a valid phone number.";
    }
    if (form.addressLine.trim().length < 3) errors.addressLine = "Enter the street address.";
    if (!form.city.trim()) errors.city = "Enter the city.";
    if (!form.state.trim()) errors.state = "Enter the state / region.";
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
      const data = await api.post("/addresses", {
        ...(form.label.trim() ? { label: form.label.trim() } : {}),
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        ...(form.postalCode.trim() ? { postalCode: form.postalCode.trim() } : {}),
        isDefault: form.isDefault,
      });
      onCreated(data.address);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error-soft px-4 py-3 text-sm font-medium text-error"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Label"
          value={form.label}
          onChange={update("label")}
          placeholder="Home, Work…"
          hint="Optional."
        />
        <Input
          label="Recipient name"
          required
          value={form.recipientName}
          onChange={update("recipientName")}
          error={fieldErrors.recipientName}
          autoComplete="name"
        />
        <Input
          label="Phone"
          type="tel"
          required
          value={form.phone}
          onChange={update("phone")}
          error={fieldErrors.phone}
          autoComplete="tel"
          placeholder="+234 801 234 5678"
        />
        <Input
          label="City"
          required
          value={form.city}
          onChange={update("city")}
          error={fieldErrors.city}
          autoComplete="address-level2"
        />
        <div className="sm:col-span-2">
          <Input
            label="Street address"
            required
            value={form.addressLine}
            onChange={update("addressLine")}
            error={fieldErrors.addressLine}
            autoComplete="street-address"
            placeholder="House number, street, area"
          />
        </div>
        <Input
          label="State / region"
          required
          value={form.state}
          onChange={update("state")}
          error={fieldErrors.state}
          autoComplete="address-level1"
        />
        <Input
          label="Country"
          required
          value={form.country}
          onChange={update("country")}
          autoComplete="country-name"
        />
        <Input
          label="Postal code"
          value={form.postalCode}
          onChange={update("postalCode")}
          hint="Optional."
        />
        <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isDefault: event.target.checked }))
            }
            className="size-4 rounded border-border text-primary focus:ring-primary"
          />
          Set as default address
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save address
        </Button>
      </div>
    </form>
  );
}
