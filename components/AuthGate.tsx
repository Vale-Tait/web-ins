"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProductLoadingFrame } from "@/components/ProductLoading";
import { getAuthSession } from "@/lib/auth-store";

export function AuthGate({
  children,
  fallback = <ProductLoadingFrame />
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const initialPathnameRef = useRef(pathname);

  useEffect(() => {
    let active = true;
    const requestedPathname = initialPathnameRef.current;
    getAuthSession()
      .then((session) => {
        if (!active) return;
        if (session) {
          setAllowed(true);
          return;
        }
        router.replace(`/auth?next=${encodeURIComponent(requestedPathname)}`);
      })
      .catch(() => {
        if (active) router.replace(`/auth?next=${encodeURIComponent(requestedPathname)}`);
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (!allowed) return fallback;
  return <>{children}</>;
}
