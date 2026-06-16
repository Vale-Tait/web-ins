"use client";

export type AuthSession = {
  email: string;
  firstName: string;
  lastName: string;
};

const authKey = "wim:auth:v1";

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(authKey);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Partial<AuthSession>;
    if (!parsed.email || !parsed.firstName || !parsed.lastName) return null;
    return {
      email: parsed.email,
      firstName: parsed.firstName,
      lastName: parsed.lastName
    };
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(
    authKey,
    JSON.stringify({
      email: session.email.trim(),
      firstName: session.firstName.trim(),
      lastName: session.lastName.trim()
    })
  );
}

export function clearAuthSession() {
  window.localStorage.removeItem(authKey);
}
