"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductShell } from "@/components/ProductShell";
import { clearAuthSession, getAuthSession } from "@/lib/auth-store";
import type { AuthSession } from "@/lib/auth-store";

function SettingsContent() {
  const router = useRouter();
  const [session] = useState<AuthSession | null>(() => getAuthSession());
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const canChange = currentPassword.trim().length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;

  function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canChange) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password updated.");
  }

  function logout() {
    clearAuthSession();
    router.replace("/auth");
  }

  return (
    <section className="mx-auto max-w-[720px] px-7 py-16 md:px-10">
      <p className="mono text-sm text-[var(--muted)]">{session?.email ?? "User settings"}</p>
      <h1 className="mono mt-3 text-[34px] font-semibold">User Settings</h1>

      <form onSubmit={changePassword} className="mt-12 border border-[var(--line)] p-7">
        <h2 className="mono text-2xl font-semibold">Change Password</h2>
        <div className="mt-7 grid gap-4">
          <input
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            placeholder="Current password"
            className="dialog-field h-12 px-4 outline-none"
          />
          <input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            placeholder="New password"
            className="dialog-field h-12 px-4 outline-none"
          />
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            placeholder="Confirm new password"
            className="dialog-field h-12 px-4 outline-none"
          />
        </div>
        {message ? <p className="mono mt-4 text-sm text-[var(--muted)]">{message}</p> : null}
        <button disabled={!canChange} className="dialog-primary-button mt-7 h-12 rounded-[3px] px-7 mono font-semibold">
          Change Password
        </button>
      </form>

      <div className="mt-8 border border-[var(--line)] p-7">
        <h2 className="mono text-2xl font-semibold">Logout</h2>
        <button type="button" onClick={logout} className="dialog-secondary-button mt-5 h-12 rounded-[3px] px-7 mono font-semibold">
          Logout
        </button>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <ProductShell>
      <SettingsContent />
    </ProductShell>
  );
}
