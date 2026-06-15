import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetLink('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'If this email exists, a password recovery link has been sent.');
      if (res.data.demoResetLink) {
        setResetLink(res.data.demoResetLink);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full items-center justify-center p-6 bg-[#f8f6ff]">
      <div className="w-full max-w-md space-y-6 bg-white rounded-3xl shadow-2xl p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">lock_reset</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">Forgot Password</h1>
          <p className="text-sm text-on-surface-variant">
            Enter your email address and we will send you instructions to reset your password.
          </p>
        </div>

        {message && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {message}
          </div>
        )}

        {resetLink && (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface">
            <p className="font-semibold text-sm mb-2">Demo reset link</p>
            <a href={resetLink} className="text-primary underline break-all">
              {resetLink}
            </a>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-error/20 bg-error-container/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full h-[52px] rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
          >
            {loading ? 'Sending...' : 'Send recovery email'}
          </button>
        </form>

        <div className="text-center text-sm text-on-surface-variant">
          Remembered your password?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
