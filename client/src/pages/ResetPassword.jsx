import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Reset token is missing. Please use the link sent to your email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data.message || 'Your password has been reset successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full items-center justify-center p-6 bg-[#f8f6ff]">
      <div className="w-full max-w-md space-y-6 bg-white rounded-3xl shadow-2xl p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">password</span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">Reset Password</h1>
          <p className="text-sm text-on-surface-variant">
            Use the reset link sent to your email to choose a new password.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-error/20 bg-error-container/10 px-4 py-3 text-sm text-error">
            Reset token is missing. Please go back to the forgot password page and request a new link.
          </div>
        ) : (
          <>
            {message && (
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-error/20 bg-error-container/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[52px] rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />

              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="confirmPassword">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[52px] rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        <div className="text-center text-sm text-on-surface-variant">
          Go back to{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
