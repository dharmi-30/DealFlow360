'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Input, Button, Modal, useToast } from '@/components/ui';
import { authService } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotLoading, setForgotLoading] = React.useState(false);

  // Validate form inputs
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      toast.success('Welcome back!', `Signed in as ${response.user.email}`);
      router.push('/design-system');
    } catch {
      toast.error('Authentication Error', 'Invalid credentials provided');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      toast.error('Invalid Email', 'Please enter a valid email address for reset link');
      return;
    }

    setForgotLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setForgotLoading(false);
    setIsForgotModalOpen(false);
    toast.success('Password Reset Sent', `Reset instructions sent to ${forgotEmail}`);
    setForgotEmail('');
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

        {/* Hero value proposition */}
        <div className="my-12 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Enterprise Sales Operations</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Quote. Approve. <br />
            Fulfil. Grow.
          </h1>

          <p className="text-sm leading-relaxed text-slate-400">
            Streamline your B2B sales workflow from deal qualification to automated fulfillment, dynamic discount approvals, and subscription analytics.
          </p>

          {/* Feature list */}
          <div className="space-y-2.5 pt-2">
            {[
              'Unified quotation builder & approval rules',
              'Real-time deal health & anomaly detection',
              'Warehouse fulfillment & recurring billing',
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs font-medium text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-600">
          © 2026 DealFlow360. All rights reserved.
        </div>
      </div>

      {/* Right / Form Column */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Sign in to your account</h2>
            <p className="text-xs text-slate-400">
              Enter your corporate credentials to access the DealFlow360 platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              placeholder="alex@acme.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password}
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button variant="primary" type="submit" loading={isLoading} className="w-full h-10 mt-2">
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Signup link */}
          <div className="text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Create account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Your Password"
        description="Enter your registered work email to receive a password reset link."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsForgotModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={forgotLoading} onClick={handleForgotPasswordSubmit}>
              Send Reset Link
            </Button>
          </>
        }
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
        />
      </Modal>
    </div>
  );
}
