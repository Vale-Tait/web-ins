"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthSession } from "@/lib/auth-store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed] = useState(() => Boolean(getAuthSession()));

  useEffect(() => {
    if (!allowed) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [allowed, pathname, router]);

  if (!allowed) return null;
  return <>{children}</>;
}
