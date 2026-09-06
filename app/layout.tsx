import type { Metadata } from "next";
import { AppRouteShell } from "@/components/AppRouteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Inspiration Manager",
  description: "Collect, analyze, and organize website inspiration."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouteShell>{children}</AppRouteShell>
      </body>
    </html>
  );
}
