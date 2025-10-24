import "./globals.css";
import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import AppProviders from "@/components/providers/AppProviders";
import AuthGate from "@/components/providers/AuthGate";

export const metadata: Metadata = {
  title: "CalmScroll",
  description: "Mindful scrolling",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </AppProviders>
      </body>
    </html>
  );
}
