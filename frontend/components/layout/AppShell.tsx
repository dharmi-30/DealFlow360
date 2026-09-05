'use client';

import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * AppShell — Main layout wrapper for all authenticated pages in DealFlow360.
 * Manages responsive sidebar state, top header, and main content view.
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0f1e]">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          title={title}
          subtitle={subtitle}
          onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
