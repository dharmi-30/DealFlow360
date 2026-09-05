'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  CheckCircle,
  Package,
  RefreshCw,
  Receipt,
  Users,
  Activity,
  BarChart2,
  Settings,
  Building2,
  Layers,
  Percent,
  ChevronLeft,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Tooltip } from '@/components/ui/Tooltip';

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Sales',
    items: [
      { id: 'quotations', label: 'Quotations', href: '/quotations', icon: FileText, badge: 3 },
      { id: 'pipeline', label: 'Sales Pipeline', href: '/pipeline', icon: GitBranch },
      { id: 'approvals', label: 'Approvals', href: '/approvals', icon: CheckCircle, badge: 2 },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'fulfillment', label: 'Fulfillment', href: '/fulfillment', icon: Package },
      { id: 'subscriptions', label: 'Subscriptions', href: '/subscriptions', icon: RefreshCw },
      { id: 'invoices', label: 'Invoices', href: '/invoices', icon: Receipt },
    ],
  },
  {
    title: 'Customer',
    items: [
      { id: 'customer-portal', label: 'Customer Portal', href: '/customer-portal', icon: Users },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'deal-health', label: 'Deal Health', href: '/deal-health', icon: Activity },
      { id: 'reports', label: 'Reports', href: '/reports', icon: BarChart2 },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { id: 'products', label: 'Products', href: '/products', icon: Settings },
      { id: 'customers', label: 'Customers', href: '/configuration/customers', icon: Building2 },
      { id: 'warehouses', label: 'Warehouses', href: '/configuration/warehouses', icon: Layers },
      { id: 'discount-rules', label: 'Discount Rules', href: '/configuration/discount-rules', icon: Percent },
      { id: 'design-system', label: 'Design System', href: '/design-system', icon: Zap },
    ],
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#080d1a]">
      {/* Brand Header */}
      <div className={cn(
        'flex h-14 items-center border-b border-white/[0.06] px-4 shrink-0 justify-between',
        collapsed && 'justify-center px-2'
      )}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/30">
            <Zap className="h-4.5 w-4.5 text-cyan-400" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-100 leading-none">
                DealFlow<span className="text-cyan-400">360</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5 leading-none">
                Sales Ops Platform
              </span>
            </div>
          )}
        </Link>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 scrollbar-none space-y-4">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500/80 select-none">
                {section.title}
              </h3>
            )}
            <ul className="space-y-0.5">
              {section.items.map(({ id, label, href, icon: Icon, badge }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/');

                const itemLink = (
                  <Link
                    href={href}
                    onClick={onMobileClose}
                    className={cn(
                      'group relative flex h-8 items-center gap-2.5 rounded-lg px-2 text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate leading-none">{label}</span>
                        {badge !== undefined && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500/15 px-1 text-[10px] font-semibold text-cyan-400">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );

                return (
                  <li key={id}>
                    {collapsed ? (
                      <Tooltip content={label} position="right">
                        {itemLink}
                      </Tooltip>
                    ) : (
                      itemLink
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Collapse Toggle */}
      <div className="shrink-0 border-t border-white/[0.06] p-2 hidden lg:block">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-lg text-slate-500 transition-all hover:bg-white/5 hover:text-slate-300"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="text-xs font-medium">Collapse Menu</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex relative h-full flex-col border-r border-white/[0.06] transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
