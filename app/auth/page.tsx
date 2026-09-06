"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthSession, signInWithPassword, signUpWithPassword } from "@/lib/auth-store";
import styles from "@/app/auth/auth.module.css";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    getAuthSession().then((session) => {
      if (active && session) router.replace("/collections");
    });
    return () => {
      active = false;
    };
  }, [router]);

  const isSignup = mode === "signup";
  const canSubmit = isSignup
    ? email.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0 && password.length >= 6 && password === confirmPassword
    : email.trim().length > 0 && password.length > 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError(isSignup ? "Complete all fields and confirm the password." : "Enter email and password.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (isSignup) {
        await signUpWithPassword({ email, firstName, lastName, password });
      } else {
        await signInWithPassword(email, password);
      }
      router.replace("/collections");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to authenticate.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isSignup ? "login" : "signup");
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.fieldGrid}>
            <input className={styles.field} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" autoComplete="email" />
            {isSignup ? (
              <div className={styles.nameRow}>
                <input className={styles.field} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" autoComplete="given-name" />
                <input className={styles.field} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" autoComplete="family-name" />
              </div>
            ) : null}
            <div className={styles.passwordWrap}>
              <input
                className={styles.passwordField}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button className={styles.eyeButton} type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeSlash size={22} /> : <Eye size={22} />}
              </button>
            </div>
            {isSignup ? (
              <div className={styles.passwordWrap}>
                <input
                  className={styles.passwordField}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                />
                <button
                  className={styles.eyeButton}
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeSlash size={22} /> : <Eye size={22} />}
                </button>
              </div>
            ) : null}
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          <div className={styles.actions}>
            <button className={styles.submit} type="submit" disabled={!canSubmit || submitting}>
              {isSignup ? "Sign up" : "Log in"}
            </button>
            <p className={styles.switchText}>
              {isSignup ? "Already a member? " : "Need an account? "}
              <button className={styles.switchButton} type="button" onClick={switchMode}>
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
