'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Mail, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Simulate/Trigger reset action
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error triggering password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-300 px-4">
      <div className="card w-full max-w-md bg-base-200 border border-base-100 shadow-2xl rounded-3xl overflow-hidden">
        <div className="card-body p-8 flex flex-col items-center">
          {/* Logo */}
          <div className="bg-primary text-primary-content p-3.5 rounded-2xl shadow-xl shadow-primary/25 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-base-content tracking-tight">AEGIS EYE</h2>
          <p className="text-xs text-base-content/50 uppercase tracking-widest font-semibold mb-8">
            Recover Operator Profile
          </p>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="alert alert-success rounded-xl justify-center font-medium">
                Reset Email Dispatched!
              </div>
              <p className="text-sm text-base-content/65 py-2 leading-relaxed">
                If the email <strong>{email}</strong> matches our credentials, you will receive instructions to reset your secret password shortly.
              </p>
              <Link href="/login" className="btn btn-neutral btn-sm gap-2 rounded-xl mt-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-error text-sm rounded-xl py-3.5 mb-6">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleReset} className="w-full space-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Registered Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com" 
                      className="input input-bordered w-full pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary w-full rounded-xl mt-6 shadow-lg shadow-primary/20"
                >
                  {loading ? <span className="loading loading-spinner"></span> : 'Send Reset Link'}
                </button>
              </form>

              <Link href="/login" className="link link-primary text-sm font-semibold mt-6 flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
