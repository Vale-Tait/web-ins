"use client";

import { usePathname } from "next/navigation";
import { AppProvider, useApp } from "@/components/AppProvider";
import { AuthGate } from "@/components/AuthGate";
import { ProductLoadingFrame } from "@/components/ProductLoading";
import { ProductChrome } from "@/components/ProductShell";

const productRoutePrefixes = ["/analyze", "/canvas", "/collections", "/links", "/settings"];

export function AppRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!isProductPath(pathname)) return <>{children}</>;
  const canvasWorkspace = isCanvasWorkspacePath(pathname);

  return (
    <AuthGate fallback={<ProductLoadingFrame chrome={!canvasWorkspace} canvas={canvasWorkspace} />}>
      <AppProvider>
        <ProductDataGate canvasWorkspace={canvasWorkspace}>{children}</ProductDataGate>
      </AppProvider>
    </AuthGate>
  );
}

function ProductDataGate({ children, canvasWorkspace }: { children: React.ReactNode; canvasWorkspace: boolean }) {
  const { hydrated } = useApp();

  if (!hydrated) {
    return (
      <ProductLoadingFrame chrome={!canvasWorkspace} canvas={canvasWorkspace} />
    );
  }

  return canvasWorkspace ? children : <ProductChrome>{children}</ProductChrome>;
}

function isProductPath(pathname: string) {
  return productRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isCanvasWorkspacePath(pathname: string) {
  return pathname.startsWith("/canvas/");
}
