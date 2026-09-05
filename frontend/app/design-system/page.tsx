'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  SectionHeader,
  Button,
  IconButton,
  Input,
  Select,
  SearchInput,
  Textarea,
  Badge,
  StatusBadge,
  RiskIndicator,
  ApprovalStatus,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  GlassCard,
  MetricCard,
  Tabs,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  AvatarGroup,
  ProgressBar,
  Tooltip,
  Modal,
  Drawer,
  Dropdown,
  EmptyState,
  LoadingState,
  ErrorState,
  useToast,
} from '@/components/ui';
import {
  Plus,
  Filter,
  Download,
  MoreVertical,
  DollarSign,
  TrendingUp,
  Users as UsersIcon,
  ShoppingBag,
  Bell,
  Trash,
  Edit,
} from 'lucide-react';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [searchValue, setSearchValue] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const toast = useToast();

  const approvalSteps = [
    { role: 'Sales Rep', approverName: 'Alex Rivera', status: 'approved' as const, timestamp: '10:14 AM' },
    { role: 'Sales Manager', approverName: 'Dharmi T.', status: 'approved' as const, timestamp: '11:30 AM' },
    { role: 'Finance Director', approverName: 'Sarah Chen', status: 'pending' as const },
    { role: 'VP Operations', status: 'pending' as const },
  ];

  return (
    <AppShell title="Design System Showcase" subtitle="Reusable UI Component System & Tokens">
      <PageHeader
        title="UI Component Library"
        subtitle="DealFlow360 B2B SaaS Enterprise Component System"
        badge={<Badge variant="primary">v1.0 Ready</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.info('System Info', 'Design tokens active')}>
              <Filter className="h-3.5 w-3.5" />
              Filter
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Open Modal Test
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Component Overview' },
          { id: 'inputs', label: 'Form Controls' },
          { id: 'statuses', label: 'Status & Risk Badges' },
          { id: 'data', label: 'Data Grid & Cards' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
        className="mb-6"
      />

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Metrics */}
          <div>
            <SectionHeader title="Metric Cards" description="Key performance indicators with status trends" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Annual Recurring Revenue"
                value={1420000}
                isCurrency
                change={14.2}
                icon={DollarSign}
                accentColor="cyan"
              />
              <MetricCard
                title="Active Pipeline Value"
                value={850000}
                isCurrency
                change={-2.4}
                icon={TrendingUp}
                accentColor="violet"
              />
              <MetricCard
                title="Pending Approvals"
                value={18}
                change={5}
                icon={UsersIcon}
                accentColor="amber"
              />
              <MetricCard
                title="Fulfillment Accuracy"
                value="99.4%"
                trend="up"
                changeLabel="vs target"
                icon={ShoppingBag}
                accentColor="emerald"
              />
            </div>
          </div>

          {/* Buttons & Actions */}
          <div>
            <SectionHeader title="Buttons & IconButtons" description="Standard button variants and sizes" />
            <GlassCard className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="primary" loading>
                  Loading
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
                <IconButton variant="primary" icon={<Plus className="h-4 w-4" />} />
                <IconButton variant="default" icon={<Bell className="h-4 w-4" />} />
                <IconButton variant="outline" icon={<Download className="h-4 w-4" />} />
                <IconButton variant="danger" icon={<Trash className="h-4 w-4" />} />
                <IconButton variant="ghost" icon={<Edit className="h-4 w-4" />} />
              </div>
            </GlassCard>
          </div>

          {/* Approval Workflow */}
          <div>
            <SectionHeader title="Approval Workflow visualizer" description="Multi-stage approval pipeline progress" />
            <GlassCard className="p-6">
              <ApprovalStatus steps={approvalSteps} />
            </GlassCard>
          </div>

          {/* Toast Notification Triggers */}
          <div>
            <SectionHeader title="Toast Notification System" description="Application-wide reactive alerts" />
            <GlassCard className="p-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Quotation Approved', 'QT-2026-0042 accepted by client')}
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.error('Discount Limit Exceeded', 'Requires VP approval for > 20%')}
              >
                Trigger Error Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.warning('Stock Low', 'Product SKU-884 is below minimum threshold')}
              >
                Trigger Warning Toast
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('System Update', 'New FastAPI schemas synced')}
              >
                Trigger Info Toast
              </Button>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'inputs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 space-y-4">
            <SectionHeader title="Standard Inputs" />
            <Input label="Company Name" placeholder="e.g. Acme Corp" />
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Search deals, products, customers..."
            />
            <Select
              label="Deal Stage"
              options={[
                { value: 'qualified', label: 'Qualified Prospect' },
                { value: 'proposal', label: 'Proposal Sent' },
                { value: 'negotiation', label: 'Negotiation' },
              ]}
            />
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <SectionHeader title="Advanced Controls & Validation" />
            <Input label="Discount Percentage" placeholder="15%" error="Requires manager approval above 10%" />
            <Textarea label="Deal Notes" placeholder="Enter negotiation terms and history..." />
          </GlassCard>
        </div>
      )}

      {activeTab === 'statuses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 space-y-4">
            <SectionHeader title="Quotation & Deal Statuses" />
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="draft" />
              <StatusBadge status="pending_approval" />
              <StatusBadge status="approved" />
              <StatusBadge status="negotiation" />
              <StatusBadge status="confirmed" />
              <StatusBadge status="rejected" />
              <StatusBadge status="cancelled" />
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <SectionHeader title="Risk Indicators" />
            <div className="flex flex-col gap-3">
              <RiskIndicator level="low" variant="badge" />
              <RiskIndicator level="medium" variant="bar" />
              <RiskIndicator level="high" variant="badge" />
              <RiskIndicator level="critical" variant="bar" />
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Data Table */}
          <div>
            <SectionHeader
              title="Operational Table"
              action={
                <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(true)}>
                  Inspect Drawer
                </Button>
              }
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-cyan-400">QT-2026-0042</TableCell>
                  <TableCell>Acme Enterprises</TableCell>
                  <TableCell>$124,000</TableCell>
                  <TableCell>
                    <StatusBadge status="approved" />
                  </TableCell>
                  <TableCell>
                    <RiskIndicator level="low" variant="compact" />
                  </TableCell>
                  <TableCell>
                    <Avatar name="Sarah Chen" size="xs" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Dropdown
                      trigger={<IconButton variant="ghost" size="xs" icon={<MoreVertical className="h-3.5 w-3.5" />} />}
                      items={[
                        { id: '1', label: 'View Details', onClick: () => setIsDrawerOpen(true) },
                        { id: '2', label: 'Download PDF' },
                        { id: '3', label: 'Delete', danger: true },
                      ]}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-cyan-400">QT-2026-0043</TableCell>
                  <TableCell>Globex Tech</TableCell>
                  <TableCell>$89,500</TableCell>
                  <TableCell>
                    <StatusBadge status="pending_approval" />
                  </TableCell>
                  <TableCell>
                    <RiskIndicator level="high" variant="compact" />
                  </TableCell>
                  <TableCell>
                    <Avatar name="Alex Rivera" size="xs" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Dropdown
                      trigger={<IconButton variant="ghost" size="xs" icon={<MoreVertical className="h-3.5 w-3.5" />} />}
                      items={[
                        { id: '1', label: 'View Details' },
                        { id: '2', label: 'Approve' },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Empty & Error States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EmptyState
              title="No Pending Approvals"
              description="All submitted quotations have been processed by team managers."
              actionLabel="Create Quotation"
              onAction={() => toast.info('New Quotation', 'Opening builder...')}
            />
            <ErrorState
              title="Failed to Load Stream"
              message="Could not fetch live telemetry data from server."
              onRetry={() => toast.info('Retrying connection...')}
            />
          </div>
        </div>
      )}

      {/* Modal Test */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Design System Test Modal"
        description="Verify reusable backdrop blur and dialog actions"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                toast.success('Confirmed', 'Modal action submitted cleanly.');
              }}
            >
              Confirm Action
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-300">
          This modal is fully accessible, traps escape key, and animates with smooth scale and opacity transitions.
        </p>
      </Modal>

      {/* Drawer Test */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Quotation Detail Inspector"
        description="QT-2026-0042 · Acme Enterprises"
        footer={
          <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-4">
          <ProgressBar value={75} label="Deal Approval Progress" showPercentage variant="cyan" />
          <div className="border-t border-white/5 pt-4 space-y-2">
            <span className="text-xs font-medium text-slate-400">Assigned Team</span>
            <AvatarGroup
              users={[
                { name: 'Sarah Chen' },
                { name: 'Dharmi T.' },
                { name: 'Alex Rivera' },
                { name: 'Michael Scott' },
              ]}
            />
          </div>
        </div>
      </Drawer>
    </AppShell>
  );
}
