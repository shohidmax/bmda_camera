'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithEmail, loginWithGoogle } from '../../utils/firebase';
import { Shield, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Auth failed.');
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
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-base-content tracking-tight">AEGIS EYE</h2>
          <p className="text-xs text-base-content/50 uppercase tracking-widest font-semibold mb-8">
            Access Command Center
          </p>

          {error && (
            <div className="alert alert-error text-sm rounded-xl py-3.5 mb-6">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="w-full space-y-4">
            {/* Email Field */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base-content/70">Email Address</span>
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

            {/* Password Field */}
            <div className="form-control w-full">
              <div className="flex justify-between items-center label">
                <span className="label-text font-semibold text-base-content/70">Password</span>
                <Link href="/reset-password" className="label-text-alt link link-primary font-medium">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input input-bordered w-full pl-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary w-full rounded-xl mt-6 shadow-lg shadow-primary/20"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="divider text-xs text-base-content/30 w-full my-6">OR CONTINUE WITH</div>

          {/* Google Button */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-outline btn-neutral w-full rounded-xl gap-3 text-base-content/90 font-bold"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Login
          </button>

          {/* Register Link */}
          <p className="text-sm text-base-content/50 mt-8">
            Don't have an operator profile?{' '}
            <Link href="/register" className="link link-primary font-semibold">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
