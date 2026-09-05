'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, HelpCircle, Menu, LogOut, User as UserIcon, Settings, ChevronRight, Check } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { authService } from '@/services/auth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}

// Generate breadcrumbs from route path
function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [{ label: 'Overview' }, { label: 'Dashboard' }];

  const breadcrumbs: { label: string; href?: string }[] = [];

  // Section categorization
  const sectionMap: Record<string, string> = {
    dashboard: 'Overview',
    quotations: 'Sales',
    pipeline: 'Sales',
    approvals: 'Sales',
    fulfillment: 'Operations',
    subscriptions: 'Operations',
    invoices: 'Operations',
    'customer-portal': 'Customer',
    'deal-health': 'Intelligence',
    reports: 'Intelligence',
    products: 'Configuration',
    customers: 'Configuration',
    warehouses: 'Configuration',
    'discount-rules': 'Configuration',
    'design-system': 'Configuration',
  };

  const firstSeg = segments[0];
  const category = sectionMap[firstSeg] || (segments.length > 1 ? segments[0] : 'App');
  breadcrumbs.push({ label: category.charAt(0).toUpperCase() + category.slice(1) });

  segments.forEach((seg) => {
    const formatted = seg.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({ label: formatted });
  });

  return breadcrumbs;
}

export function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentUser = authService.getCurrentUser() ?? {
    id: 'usr_default',
    name: 'Dharmi Talaviya',
    email: 'talaviyadharmi09@gmail.com',
    companyName: 'DealFlow Sales Ops',
    role: 'manager' as const,
  };

  const breadcrumbs = getBreadcrumbs(pathname);
  const derivedTitle = title ?? breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Dashboard';

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#080d1a]/90 px-4 lg:px-6 backdrop-blur-md z-20">
      {/* Left Area: Mobile Menu Toggle & Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-0.5">
          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-medium leading-none">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-600" />}
                <span className={idx === breadcrumbs.length - 1 ? 'text-slate-300 font-semibold' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Title & Subtitle */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-100 leading-none">{derivedTitle}</h1>
            {subtitle && <span className="hidden md:inline text-xs text-slate-500">• {subtitle}</span>}
          </div>
        </div>
      </div>

      {/* Right Area: Search, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={() => alert('Global search shortcut (Ctrl+K)')}
          className="hidden md:flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
        >
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <span>Search deals, quotes...</span>
          <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Dropdown */}
        <Dropdown
          trigger={
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 ring-2 ring-[#080d1a]" />
            </div>
          }
          items={[
            { id: 'n1', label: 'QT-2026-0042 approved by Manager' },
            { id: 'n2', label: 'Discount threshold alert on Deal #882' },
            { id: 'n3', label: 'Fulfillment order #FO-109 dispatched' },
          ]}
        />

        {/* Help */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Help Documentation"
          icon={<HelpCircle className="h-4 w-4" />}
        />

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-white/10" />

        {/* User Profile Menu */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-white/5 transition-colors cursor-pointer select-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 font-bold text-xs text-cyan-400 ring-1 ring-cyan-500/30">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name}</span>
                <span className="text-[10px] font-medium text-slate-400 leading-none mt-1 uppercase tracking-wider">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          }
          items={[
            {
              id: 'profile',
              label: `Profile (${currentUser.email})`,
              icon: UserIcon,
              onClick: () => router.push('/design-system'),
            },
            {
              id: 'settings',
              label: 'Account Settings',
              icon: Settings,
              onClick: () => router.push('/products'),
            },
            {
              id: 'logout',
              label: 'Sign Out',
              icon: LogOut,
              danger: true,
              onClick: handleLogout,
            },
          ]}
        />
      </div>
    </header>
  );
}
