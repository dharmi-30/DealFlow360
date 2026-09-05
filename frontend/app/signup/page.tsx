'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, User as UserIcon, Building2, Mail, Lock, Shield, ArrowRight } from 'lucide-react';
import { Input, Select, Button, useToast } from '@/components/ui';
import { authService } from '@/services/auth';
import type { UserRole } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = React.useState('');
  const [companyName, setCompanyName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('sales_rep');

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!role) {
      newErrors.role = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.signup({
        name,
        companyName,
        email,
        password,
        role,
      });

      toast.success('Account Created', `Welcome aboard, ${response.user.name}!`);
      router.push('/design-system');
    } catch {
      toast.error('Signup Failed', 'Could not create account at this time');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row bg-[#0a0f1e]">
      {/* Left / Branding Column */}
      <div className="relative flex flex-1 flex-col justify-between border-b border-white/[0.06] lg:border-b-0 lg:border-r p-8 lg:p-12 bg-gradient-to-b from-[#0d1426] to-[#0a0f1e]">
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/30">
            <Zap className="h-5 w-5 text-cyan-400" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-100">
            DealFlow<span className="text-cyan-400">360</span>
          </span>
        </div>

        {/* Value Proposition */}
        <div className="my-12 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/20">
            <Shield className="h-3.5 w-3.5" />
            <span>Fast Onboarding</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Quote. Approve. <br />
            Fulfil. Grow.
          </h1>

          <p className="text-sm leading-relaxed text-slate-400">
            Join sales teams optimizing their commercial operations with automated quote-to-cash workflows, margin safeguards, and real-time deal health scoring.
          </p>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-200 mb-1">Role-Based Access Control</p>
            Choose your organization role to customize approval thresholds, metric dashboards, and fulfillment access.
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-600">
          © 2026 DealFlow360. All rights reserved.
        </div>
      </div>

      {/* Right / Form Column */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Create your business account</h2>
            <p className="text-xs text-slate-400">
              Start managing quotations and pipeline workflows in seconds.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Sarah Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="h-4 w-4" />}
              error={errors.name}
            />

            <Input
              label="Company / Organization Name"
              type="text"
              placeholder="Acme Sales Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<Building2 className="h-4 w-4" />}
              error={errors.companyName}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="sarah@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />

            <Select
              label="Select Your Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'admin', label: 'Admin (Full Organization Access)' },
                { value: 'sales_rep', label: 'Sales Representative' },
                { value: 'manager', label: 'Sales Manager (Approver)' },
                { value: 'finance', label: 'Finance / Operations' },
              ]}
              error={errors.role}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword}
              />
            </div>

            <Button variant="primary" type="submit" loading={isLoading} className="w-full h-10 mt-2">
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Signin link */}
          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
