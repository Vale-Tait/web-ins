"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteTransitionIndicator() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const lastPathnameRef = useRef(pathname);
  const pendingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    function scheduleVisible() {
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = window.setTimeout(() => {
        pendingTimerRef.current = null;
        setVisible(true);
      }, 120);
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;

      const nextUrl = new URL(target.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (`${nextUrl.pathname}${nextUrl.search}` === `${window.location.pathname}${window.location.search}`) return;

      scheduleVisible();
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      lastPathnameRef.current = pathname;
      if (pendingTimerRef.current) {
        window.clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      setVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  return (
    <div className="route-transition-indicator" data-visible={visible ? "true" : "false"} aria-hidden="true">
      <span />
    </div>
  );
}
