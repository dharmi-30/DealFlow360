import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | DealFlow360',
    default: 'DealFlow360 — B2B Sales Operations Platform',
  },
  description:
    'DealFlow360 is a modern B2B sales operations platform for managing deals, quotations, approvals, subscriptions, and more.',
  keywords: ['sales operations', 'CRM', 'B2B', 'quotations', 'deal management'],
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
