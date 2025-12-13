import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Tenant Management SaaS - Manage Your Properties Easily</title>
        <meta name="description" content="Simple and modern tenant management system for Indian property owners" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">RentManager</h1>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-primary-600 px-3 py-2">
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  Start Free Trial
                </Link>
              </div>
              <button
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Stop Managing Rent with
              <span className="text-primary-600"> Excel & Paper</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              A simple, modern SaaS platform designed for Indian property owners.
              Manage tenants, track payments, and generate reports - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3">
                Start Free Trial - No Card Required
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-3">
                Login
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">60-day free trial • No credit card required</p>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`card ${plan.popular ? 'border-2 border-primary-600' : ''}`}
                >
                  {plan.popular && (
                    <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-2xl font-bold mt-4 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    {plan.period && <span className="text-gray-600">/{plan.period}</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block text-center w-full py-2 rounded-lg font-medium ${
                      plan.popular
                        ? 'btn-primary'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">RentManager</h3>
                <p className="text-gray-400">Simple tenant management for Indian property owners.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/features" className="hover:text-white">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                  <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} RentManager. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

const features = [
  {
    icon: '🏠',
    title: 'Property Management',
    description: 'Add and manage multiple properties with ease. Track occupancy status and property details.'
  },
  {
    icon: '👥',
    title: 'Tenant Management',
    description: 'Store tenant information, documents (Aadhaar, Agreement, Photos), and contact details.'
  },
  {
    icon: '💰',
    title: 'Payment Tracking',
    description: 'Track rent payments, deposits, and extra dues. Support for Cash, UPI, and Bank Transfer.'
  },
  {
    icon: '📘',
    title: 'Tenant Ledger',
    description: 'Passbook-style ledger for each tenant with running balance and payment history.'
  },
  {
    icon: '🧾',
    title: 'Expense Management',
    description: 'Track property-wise and tenant-wise expenses. Categorize as Repair, Maintenance, or Utilities.'
  },
  {
    icon: '📊',
    title: 'Reports & Analytics',
    description: 'Generate balance sheets, property-wise income reports, and export to PDF/Excel.'
  },
];

const pricingPlans = [
  {
    name: 'Free Trial',
    price: '0',
    period: null,
    features: [
      '60-day free trial',
      'All features included',
      'No credit card required',
      'Full access to dashboard'
    ],
    buttonText: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Monthly',
    price: '499',
    period: 'month',
    features: [
      'Unlimited properties',
      'Unlimited tenants',
      'All features included',
      'Email support',
      'Regular updates'
    ],
    buttonText: 'Get Started',
    popular: true
  },
  {
    name: 'Yearly',
    price: '4,999',
    period: 'year',
    features: [
      'Everything in Monthly',
      'Save ₹989 (2 months free)',
      'Priority support',
      'Early access to features',
      'Best value'
    ],
    buttonText: 'Get Started',
    popular: false
  },
];

