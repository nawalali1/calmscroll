'use client';

import { ReactNode } from 'react';
import BottomNav from '@/components/BottomNav';
import AuthGate from '@/components/providers/AuthGate';
import { MobileThemeProvider, useMobileTheme } from '@/components/providers/MobileThemeProvider';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { theme } = useMobileTheme();

  return (
    <div 
      className={`fixed inset-0 flex flex-col w-screen h-screen max-w-md mx-auto ${
        theme === 'dark' 
          ? 'bg-slate-900' 
          : 'bg-slate-50'
      }`}
      data-theme={theme}
    >
      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        {children}
      </main>
      
      {/* Fixed bottom nav */}
      <div className="flex-shrink-0 w-full border-t border-slate-200 dark:border-slate-800">
        <BottomNav />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthGate>
      <MobileThemeProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </MobileThemeProvider>
    </AuthGate>
  );
}
