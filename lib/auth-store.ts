"use client";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/utils/supabase/client";

export type AuthSession = {
  email: string;
  firstName: string;
  lastName: string;
};

function sessionFromUser(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null): AuthSession | null {
  if (!user?.email) return null;
  const firstName = typeof user.user_metadata?.firstName === "string" ? user.user_metadata.firstName : user.email.split("@")[0] || "User";
  const lastName = typeof user.user_metadata?.lastName === "string" ? user.user_metadata.lastName : "Account";
  return { email: user.email, firstName, lastName };
}

function authErrorMessage(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? "";
  const code = error?.code ?? "";
  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes("email rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "Signup email is rate limited. Disable email confirmation in Supabase Auth > Providers > Email for this MVP, then try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email confirmation is still enabled in Supabase. Disable it for this MVP or confirm the account email before logging in.";
  }

  return message || "Unable to authenticate.";
}

export async function getAuthSession(): Promise<AuthSession | null> {
  if (typeof window === "undefined" || !hasSupabasePublicEnv()) return null;
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return sessionFromUser(user);
}

export async function signUpWithPassword(session: AuthSession & { password: string }): Promise<AuthSession> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: session.email.trim(),
    password: session.password,
    options: {
      data: {
        firstName: session.firstName.trim(),
        lastName: session.lastName.trim()
      }
    }
  });
  if (error) throw new Error(authErrorMessage(error));
  const user = data.user;
  const next = sessionFromUser(user);
  if (!user || !next) throw new Error("Unable to create session. Check that email confirmation is disabled for this MVP.");
  await supabase.from("profiles").upsert({
    id: user.id,
    email: next.email,
    name: `${next.firstName} ${next.lastName}`.trim(),
    theme: "system"
  });
  return next;
}

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(authErrorMessage(error));
  const next = sessionFromUser(data.user);
  if (!next) throw new Error("Unable to load session.");
  return next;
}

export async function updatePassword(password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(authErrorMessage(error));
}

export async function clearAuthSession() {
  if (!hasSupabasePublicEnv()) return;
  const supabase = createClient();
  await supabase.auth.signOut();
}
