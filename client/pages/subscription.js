import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { getAuth } from '../lib/auth';

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      toast.error('Failed to load subscription info');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    // In a real implementation, this would integrate with Razorpay
    toast.success(`Subscription to ${plan} plan will be implemented with Razorpay integration`);
    // TODO: Implement Razorpay payment flow
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  const isTrialActive = user?.isTrialActive;
  const hasActiveSubscription = user?.hasActiveSubscription;

  return (
    <>
      <Head>
        <title>Subscription - RentManager</title>
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>

          {/* Current Status */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            {isTrialActive ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✓ You are on a free trial</p>
                <p className="text-gray-600">
                  Trial ends on: {new Date(user.subscription.trialEndDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Days remaining: {Math.ceil((new Date(user.subscription.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            ) : hasActiveSubscription ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✓ Active Subscription</p>
                <p className="text-gray-600">
                  Plan: {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
                </p>
                {user.subscription.subscriptionEndDate && (
                  <p className="text-gray-600">
                    Renews on: {new Date(user.subscription.subscriptionEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600 font-medium">⚠ Trial Expired</p>
                <p className="text-gray-600">
                  Your trial has ended. Please subscribe to continue using all features.
                </p>
              </div>
            )}
          </div>

          {/* Pricing Plans */}
          {(!hasActiveSubscription || isTrialActive) && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Choose a Plan</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card border-2 border-primary-600">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold mb-2">Monthly</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">₹499</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Unlimited properties</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Unlimited tenants</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>All features included</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Email support</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe('monthly')}
                    className="w-full btn-primary"
                  >
                    Subscribe Now
                  </button>
                </div>

                <div className="card">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold mb-2">Yearly</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">₹4,999</span>
                      <span className="text-gray-600">/year</span>
                    </div>
                    <p className="text-sm text-green-600 font-medium">Save ₹989 (2 months free)</p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Everything in Monthly</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Early access to features</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Best value</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe('yearly')}
                    className="w-full btn-primary"
                  >
                    Subscribe Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

