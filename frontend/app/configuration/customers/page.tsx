'use client';

import * as React from 'react';
import {
  Users,
  Plus,
  Edit2,
  Eye,
  Building2,
  Award,
  DollarSign,
  Mail,
  Phone,
  CheckCircle2,
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
import { customersService } from '@/services';
import type { CustomerAccount, CustomerTier } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function CustomersConfigPage() {
  const toast = useToast();
  const [customers, setCustomers] = React.useState<CustomerAccount[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    customersService.getCustomers().then((data) => {
      if (isMounted) {
        setCustomers(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<CustomerAccount | null>(null);

  // Form State
  const [formData, setFormData] = React.useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    tier: 'Gold' as CustomerTier,
    defaultDiscount: 10.0,
    creditLimit: 500000,
  });

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchQuery, tierFilter]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      tier: 'Silver',
      defaultDiscount: 5.0,
      creditLimit: 250000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: CustomerAccount) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone,
      tier: customer.tier,
      defaultDiscount: customer.defaultDiscount,
      creditLimit: customer.creditLimit,
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Validation Error', 'Company name and email are required.');
      return;
    }

    if (editingCustomer) {
      const updated = await customersService.updateCustomer(editingCustomer.id, {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        tier: formData.tier,
        defaultDiscount: Number(formData.defaultDiscount),
        creditLimit: Number(formData.creditLimit),
      });
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success('Customer Updated', `${formData.name} account details updated.`);
    } else {
      const newCust = await customersService.createCustomer({
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        tier: formData.tier,
        defaultDiscount: Number(formData.defaultDiscount),
        creditLimit: Number(formData.creditLimit),
      });
      setCustomers((prev) => [newCust, ...prev]);
      toast.success('Customer Created', `${formData.name} added to customer directory.`);
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

  return (
    <AppShell title="Customer Accounts" subtitle="Client Directory & Tiered Commercial Discount Rules">
      <PageHeader
        title="Customer Directory & Account Management"
        subtitle="Manage B2B customer accounts, commercial tiers (Bronze, Silver, Gold), and credit limits"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Customer Account</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* SEARCH & TIER FILTER */}
        <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search company, contact, email..."
            />
          </div>

          <div className="w-44">
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Tiers' },
                { value: 'Gold', label: 'Gold Tier' },
                { value: 'Silver', label: 'Silver Tier' },
                { value: 'Bronze', label: 'Bronze Tier' },
              ]}
            />
          </div>
        </GlassCard>

        {/* CUSTOMERS TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Customer Accounts ({filteredCustomers.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3">Contact Person</th>
                  <th className="py-2.5 px-3">Email / Phone</th>
                  <th className="py-2.5 px-3 text-center">Customer Tier</th>
                  <th className="py-2.5 px-3 text-center">Default Discount</th>
                  <th className="py-2.5 px-3 text-right">Credit Limit</th>
                  <th className="py-2.5 px-3 text-center">Account Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-3 font-semibold text-slate-100">{c.name}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-200">{c.contactPerson}</td>
                    <td className="py-3.5 px-3">
                      <span className="text-slate-300 block">{c.email}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center">{getTierBadge(c.tier)}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-400 font-mono">
                      -{c.defaultDiscount}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-cyan-400 font-mono">
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <IconButton
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenEdit(c)}
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
        title={editingCustomer ? `Edit Customer — ${editingCustomer.name}` : 'Add New Customer Account'}
        description="Configure account details, customer tier (Bronze, Silver, Gold), and credit terms."
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCustomer}>
              {editingCustomer ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company / Account Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Enterprises Inc."
            />

            <Input
              label="Contact Person Name"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Johnathan Vance"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jvance@acme.com"
            />

            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 019-2834"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Customer Tier"
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as CustomerTier })}
              options={[
                { value: 'Bronze', label: 'Bronze Tier' },
                { value: 'Silver', label: 'Silver Tier' },
                { value: 'Gold', label: 'Gold Tier' },
              ]}
            />

            <Input
              type="number"
              label="Default Tier Discount (%)"
              value={formData.defaultDiscount}
              onChange={(e) => setFormData({ ...formData, defaultDiscount: parseFloat(e.target.value) || 0 })}
            />

            <Input
              type="number"
              label="Credit Limit ($)"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
