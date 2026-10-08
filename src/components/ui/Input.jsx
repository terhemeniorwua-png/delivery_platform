"use client";

import { forwardRef, useId } from "react";

const FIELD_CLASS =
  "w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-70";

const STATE_CLASS = {
  idle: "border-border focus:border-primary",
  error: "border-error focus:border-error",
};

function FieldShell({ id, label, error, hint, required, children }) {
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required ? <span className="ml-0.5 text-error">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Text input with label, hint and error states. */
export const Input = forwardRef(function Input(
  { label, error, hint, required, className = "", id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required}>
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_CLASS} ${STATE_CLASS[error ? "error" : "idle"]} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

/** Multi-line text field with the same shell as Input. */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className = "", rows = 4, id, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_CLASS} resize-y ${STATE_CLASS[error ? "error" : "idle"]} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

/** Native select, styled to match Input. `children` are the options. */
export const Select = forwardRef(function Select(
  { label, error, hint, required, className = "", id, children, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} required={required}>
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${FIELD_CLASS} cursor-pointer ${STATE_CLASS[error ? "error" : "idle"]} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export default Input;
