import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Inspiration Manager",
  description: "Collect, analyze, and organize website inspiration."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
