'use client';

import * as React from 'react';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Percent,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Input,
  Button,
  IconButton,
  Badge,
  Modal,
  useToast,
} from '@/components/ui';
import { discountRulesService } from '@/services';
import type { DiscountRuleConfig, CustomerTier } from '@/types';

export default function DiscountRulesConfigPage() {
  const toast = useToast();
  const [rules, setRules] = React.useState<DiscountRuleConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    discountRulesService.getDiscountRules().then((data) => {
      if (isMounted) {
        setRules(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  const [tierFilter, setTierFilter] = React.useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<DiscountRuleConfig | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    ruleName: '',
    customerTier: 'Gold' as CustomerTier,
    maxDiscountPercentage: 20.0,
    categoryRestriction: 'All Categories',
    approvalRequirement: 'auto_approved' as 'auto_approved' | 'manager_approval' | 'executive_approval',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredRules = React.useMemo(() => {
    return rules.filter((r) => tierFilter === 'all' || r.customerTier === tierFilter);
  }, [rules, tierFilter]);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      ruleName: '',
      customerTier: 'Silver',
      maxDiscountPercentage: 15.0,
      categoryRestriction: 'All Categories',
      approvalRequirement: 'manager_approval',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: DiscountRuleConfig) => {
    setEditingRule(rule);
    setFormData({
      ruleName: rule.ruleName,
      customerTier: rule.customerTier,
      maxDiscountPercentage: rule.maxDiscountPercentage,
      categoryRestriction: rule.categoryRestriction,
      approvalRequirement: rule.approvalRequirement,
      status: rule.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!formData.ruleName.trim()) {
      toast.error('Validation Error', 'Rule name is required.');
      return;
    }

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                ruleName: formData.ruleName,
                customerTier: formData.customerTier,
                maxDiscountPercentage: Number(formData.maxDiscountPercentage),
                categoryRestriction: formData.categoryRestriction,
                approvalRequirement: formData.approvalRequirement,
                status: formData.status,
              }
            : r
        )
      );
      toast.success('Discount Rule Updated', `${formData.ruleName} policy updated.`);
    } else {
      const newRule: DiscountRuleConfig = {
        id: `rule_${Date.now()}`,
        ruleName: formData.ruleName,
        customerTier: formData.customerTier,
        maxDiscountPercentage: Number(formData.maxDiscountPercentage),
        categoryRestriction: formData.categoryRestriction,
        approvalRequirement: formData.approvalRequirement,
        status: formData.status,
      };
      setRules((prev) => [...prev, newRule]);
      toast.success('Discount Rule Created', `${formData.ruleName} added to policy matrix.`);
    }

    setIsModalOpen(false);
  };

  const getTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            ★ Gold Tier
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-300/15 text-slate-300 border border-slate-400/30">
            Silver Tier
          </span>
        );
      case 'Bronze':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Bronze Tier
          </span>
        );
    }
  };

  const getApprovalRequirementBadge = (req: DiscountRuleConfig['approvalRequirement']) => {
    switch (req) {
      case 'auto_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            Auto-Approved
          </span>
        );
      case 'manager_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" />
            Manager Sign-off
          </span>
        );
      case 'executive_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <ShieldAlert className="h-3 w-3" />
            VP / Finance Director Sign-off
          </span>
        );
    }
  };

  return (
    <AppShell title="Discount Safeguard Rules" subtitle="Tiered Commercial Policy Matrix & Approval Governance">
      <PageHeader
        title="Discount Safeguard Policy Matrix"
        subtitle="Configure commercial discount limits per customer tier (Bronze, Silver, Gold) and approval triggers"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Policy Rule</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* TIER FILTER BAR */}
        <GlassCard className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Filter Policy Rules by Customer Tier
            </span>
          </div>

          <div className="w-44">
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Customer Tiers' },
                { value: 'Gold', label: 'Gold Tier Rules' },
                { value: 'Silver', label: 'Silver Tier Rules' },
                { value: 'Bronze', label: 'Bronze Tier Rules' },
              ]}
            />
          </div>
        </GlassCard>

        {/* VISUAL RULES MATRIX TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Policy Safeguard Matrix ({filteredRules.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Enforced dynamically in Quotation Builder</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Policy Rule Name</th>
                  <th className="py-2.5 px-3 text-center">Customer Tier</th>
                  <th className="py-2.5 px-3 text-center">Max Discount Threshold</th>
                  <th className="py-2.5 px-3">Product / Category Restriction</th>
                  <th className="py-2.5 px-3 text-center">Required Approval Role</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-3 font-semibold text-slate-100">{rule.ruleName}</td>
                    <td className="py-3.5 px-3 text-center">{getTierBadge(rule.customerTier)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-extrabold text-amber-400 font-mono text-sm">
                        ≤ {rule.maxDiscountPercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{rule.categoryRestriction}</td>
                    <td className="py-3.5 px-3 text-center">
                      {getApprovalRequirementBadge(rule.approvalRequirement)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge variant={rule.status === 'active' ? 'success' : 'outline'}>
                        {rule.status === 'active' ? 'Active Policy' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenEdit(rule)}
                        icon={<Edit2 className="h-3.5 w-3.5 text-cyan-400" />}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* FORM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? `Edit Policy Rule — ${editingRule.ruleName}` : 'Add Discount Policy Safeguard'}
        description="Configure discount threshold caps, customer tier applicability, and approval triggers."
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRule}>
              {editingRule ? 'Save Policy Changes' : 'Create Policy Rule'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-300">
          <Input
            label="Policy Rule Name"
            value={formData.ruleName}
            onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
            placeholder="e.g. Gold Tier Executive Discount Sign-off"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Applicable Customer Tier"
              value={formData.customerTier}
              onChange={(e) => setFormData({ ...formData, customerTier: e.target.value as CustomerTier })}
              options={[
                { value: 'Bronze', label: 'Bronze Tier' },
                { value: 'Silver', label: 'Silver Tier' },
                { value: 'Gold', label: 'Gold Tier' },
              ]}
            />

            <Input
              type="number"
              label="Maximum Discount Threshold (%)"
              value={formData.maxDiscountPercentage}
              onChange={(e) => setFormData({ ...formData, maxDiscountPercentage: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category / Product Restriction"
              value={formData.categoryRestriction}
              onChange={(e) => setFormData({ ...formData, categoryRestriction: e.target.value })}
              placeholder="e.g. All Categories or Hardware Only"
            />

            <Select
              label="Required Approval Role"
              value={formData.approvalRequirement}
              onChange={(e) => setFormData({ ...formData, approvalRequirement: e.target.value as any })}
              options={[
                { value: 'auto_approved', label: 'Auto-Approved (No Review Required)' },
                { value: 'manager_approval', label: 'Manager Sign-off Required' },
                { value: 'executive_approval', label: 'VP / Finance Director Sign-off' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
