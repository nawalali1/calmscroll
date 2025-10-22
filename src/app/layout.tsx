import "./globals.css";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "CalmScroll",
  description: "Mindful scrolling",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
