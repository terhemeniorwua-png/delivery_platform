"use client";

import { useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/** Profile + password management for the signed-in customer. */
export default function ProfileView() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      await api.patch("/auth/me", {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim(),
      });
      await refreshUser();
      toast("Profile updated", { type: "success" });
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (savingPassword) return;
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast("New passwords do not match", { type: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/auth/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast("Password updated", { type: "success" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast(getApiErrorMessage(err), { type: "error" });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Profile</h1>
        <p className="mt-1 text-sm text-muted">Manage your account details and password.</p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Account details</h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstName"
              autoComplete="given-name"
              required
              value={profile.firstName}
              onChange={(event) =>
                setProfile((current) => ({ ...current, firstName: event.target.value }))
              }
            />
            <Input
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              required
              value={profile.lastName}
              onChange={(event) =>
                setProfile((current) => ({ ...current, lastName: event.target.value }))
              }
            />
          </div>
          <Input
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={profile.phone}
            onChange={(event) =>
              setProfile((current) => ({ ...current, phone: event.target.value }))
            }
            hint="Optional — used for delivery updates."
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            value={user?.email ?? ""}
            disabled
            hint="Email cannot be changed here."
          />
          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink">Change password</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <Input
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={passwords.currentPassword}
            onChange={(event) =>
              setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, newPassword: event.target.value }))
              }
              hint="At least 8 characters, with a letter and a number."
            />
            <Input
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={passwords.confirmPassword}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={savingPassword}>
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}