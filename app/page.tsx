'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './providers';

export default function Home() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || loading) return;
    if (user) {
      window.location.href = '/dashboard';
      return;
    }
  }, [user, loading, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar - minimal */}
      <header className="sticky top-0 z-50 bg-surface-card/90 backdrop-blur-md shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-ink flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#BFD9FF] to-[#D6ECFF] flex items-center justify-center text-primary-600 text-sm font-bold shadow-soft">T</span>
            Tenant Manager
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-ink-muted hover:text-ink text-sm font-medium">Features</a>
            <a href="#pricing" className="text-ink-muted hover:text-ink text-sm font-medium">Pricing</a>
            <a href="#testimonials" className="text-ink-muted hover:text-ink text-sm font-medium">Testimonials</a>
            <Link href="/login" className="text-ink font-medium text-sm hover:text-primary-500">Login</Link>
            <Link href="/register" className="btn-pill-primary">Start Free Trial</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink tracking-tight">
            Smart Tenant Management Made Simple
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto">
            Streamline properties, track rent, handle maintenance, and get paid on time—all in one place.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register" className="w-full sm:w-auto min-h-[48px] flex items-center justify-center btn-pill-primary px-8">
              Start Free Trial
            </Link>
            <Link href="/login" className="w-full sm:w-auto min-h-[48px] flex items-center justify-center btn-pill px-8 bg-slate-50 text-ink font-semibold hover:bg-primary-soft/50 hover:text-primary-600 transition">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard preview mockup */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 lg:py-20 bg-slate-100/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">Your dashboard at a glance</h2>
          <p className="mt-2 text-ink-muted text-center max-w-xl mx-auto">Properties, tenants, rent, and reports in one clean view.</p>
          <div className="mt-10 rounded-2xl overflow-hidden shadow-soft-lg border border-slate-200 bg-surface-card">
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-secondary" />
            </div>
            <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Properties', 'Tenants', 'Rent Collected', 'Pending'].map((label, i) => (
                <div key={label} className="rounded-xl bg-surface p-4 border border-slate-100">
                  <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{i === 0 ? '12' : i === 1 ? '48' : i === 2 ? '₹2.4L' : '₹18K'}</p>
                </div>
              ))}
            </div>
            <div className="h-48 sm:h-64 bg-slate-50 flex items-center justify-center text-ink-muted text-sm">Charts & recent activity</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">Everything you need to manage rentals</h2>
          <p className="mt-2 text-ink-muted text-center">Built for landlords and property managers.</p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Tenant Management', desc: 'Track tenants, leases, and contact details in one place.', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { title: 'Rent Tracking', desc: 'Collect rent, record payments, and see what’s due at a glance.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: 'Maintenance Requests', desc: 'Log and track maintenance issues and get them resolved faster.', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              { title: 'Payment History', desc: 'Full payment history and exportable reports for accounting.', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-surface-card p-6 shadow-soft border border-slate-100 hover:shadow-soft-lg transition">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24 bg-slate-50/80">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">Simple pricing</h2>
          <p className="mt-2 text-ink-muted text-center">Start free, upgrade when you need more.</p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: 'Free', desc: 'Up to 5 properties', features: ['Tenant list', 'Rent tracking', 'Basic reports'] },
              { name: 'Pro', price: '₹999', period: '/mo', desc: 'Unlimited properties', features: ['Everything in Starter', 'Maintenance requests', 'Payment history', 'Export reports'], highlight: true },
              { name: 'Enterprise', price: 'Custom', desc: 'For large portfolios', features: ['Everything in Pro', 'API access', 'Dedicated support'] },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-6 border-2 transition ${plan.highlight ? 'border-primary bg-surface-card shadow-soft-lg' : 'border-slate-200 bg-surface-card shadow-soft'}`}>
                <h3 className="font-semibold text-ink">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold text-ink">{plan.price}<span className="text-base font-normal text-ink-muted">{plan.period ?? ''}</span></p>
                <p className="text-sm text-ink-muted">{plan.desc}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-ink flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0"><svg className="w-2.5 h-2.5 text-secondary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`mt-6 block w-full min-h-[48px] flex items-center justify-center rounded-xl font-semibold transition ${plan.highlight ? 'bg-primary text-white hover:bg-primary-700' : 'bg-slate-100 text-ink hover:bg-slate-200'}`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">Loved by property managers</h2>
          <p className="mt-2 text-ink-muted text-center">See what our users say.</p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { quote: 'Rent collection became effortless. I can see who paid and who hasn’t in one screen.', name: 'Priya S.', role: 'Property owner, Mumbai' },
              { quote: 'Maintenance requests no longer get lost. Tenants are happier and so am I.', name: 'Rahul K.', role: 'Manager, 20+ units' },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl bg-surface-card p-6 shadow-soft border border-slate-100">
                <p className="text-ink">"{t.quote}"</p>
                <p className="mt-4 font-semibold text-ink">{t.name}</p>
                <p className="text-sm text-ink-muted">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-surface-card px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">T</span>
            <span className="font-semibold text-ink">Tenant Manager</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link href="/" className="text-ink-muted hover:text-ink">Home</Link>
            <a href="#features" className="text-ink-muted hover:text-ink">Features</a>
            <a href="#pricing" className="text-ink-muted hover:text-ink">Pricing</a>
            <Link href="/login" className="text-ink-muted hover:text-ink">Login</Link>
            <Link href="/register" className="text-ink-muted hover:text-ink">Register</Link>
          </nav>
        </div>
        <p className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-100 text-center text-sm text-ink-muted">
          © {new Date().getFullYear()} Tenant Manager. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
