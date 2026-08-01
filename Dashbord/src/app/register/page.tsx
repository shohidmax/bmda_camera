'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '../../utils/firebase';
import { Shield, Lock, Mail } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed.');
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
          <p className="text-xs text-base-content/75 uppercase tracking-widest font-semibold mb-8">
            Create Security Operator Profile
          </p>

          {error && (
            <div className="alert alert-error text-sm rounded-xl py-3.5 mb-6">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="w-full space-y-4">
            {/* Email Field */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base-content/70">Email Address</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/70">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="input input-bordered w-full pl-10 rounded-xl text-base-content"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base-content/70">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/70">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input input-bordered w-full pl-10 rounded-xl text-base-content"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold text-base-content/70">Confirm Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/70">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="input input-bordered w-full pl-10 rounded-xl text-base-content"
                  required
                />
              </div>
            </div>

            {/* Register Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary w-full rounded-xl mt-6 shadow-lg shadow-primary/20"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Register'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-sm text-base-content/75 mt-8">
            Already have an operator profile?{' '}
            <Link href="/login" className="link link-primary font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
