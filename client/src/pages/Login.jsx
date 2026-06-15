import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [email, setEmail] = useState('vikash@splitflow.in');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Notify application state
      window.dispatchEvent(new Event('auth-change'));
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side: Visual Branding (High Fidelity Illustration) */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-container items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover mix-blend-overlay opacity-60"
            alt="Fluid financial connectivity illustration"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrJTZFimAHLkqBS_0xE5Y_0fFgW4ZrNiReJGiDDEiTtDDoFIFVsq5l8F3jBIsbrqxroJPe0RHk8y_9NatXIJJo7LXhnXX4ebL573pqBYBj8NxVbfmSjAAkIKp0MddDGy-EAOwzq_mXs7_-xLbwVfO9Qni1yUafrparyxQmwa5IdRfhfg5E-nlyxIbH4rfzDgS5kEQ_9_1MpJq4tuxOCdAHMHiRRq9unvz9mPGIw7zcaGkmx7y2dI9wYCjBE-dWKhMf06TX_VC0dmjg"
          />
        </div>
        <div className="relative z-10 p-10 max-w-lg text-white space-y-6">
          <div>
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container/20 text-[#6ffbbe] text-xs font-semibold backdrop-blur-md border border-[#6cf8bb]/30">
              <span className="material-symbols-outlined mr-1 text-[18px] !font-normal">verified</span>
              Trusted by 10k+ Teams
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Effortless settlements for modern finance.
          </h1>
          <p className="text-on-primary-container/85 text-base leading-relaxed">
            SplitFlow simplifies complex expense sharing with real-time tracking and automated reconciliation. Join the future of collaborative payments.
          </p>
          {/* Floating Glass Card (Social Proof/Micro-UI) */}
          <div className="glass-panel p-6 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary">Settlement Success</p>
                <p className="text-xl font-bold text-[#1b1b24]">₹ 2,450.00</p>
              </div>
            </div>
            <div className="w-full bg-[#e4e1ee] h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full w-[85%]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 mesh-gradient relative">
        <div className="w-full max-w-[420px] space-y-6 fade-up">
          {/* Branding */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center gap-1 justify-center lg:justify-start">
              <div className="bg-primary p-1 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[24px] !font-normal">account_balance</span>
              </div>
              <span className="text-3xl font-extrabold text-primary tracking-tighter">SplitFlow</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Welcome Back</h2>
            <p className="text-xs text-on-surface-variant">Please enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container border border-error/20 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="email">Email address</label>
              <div className="relative group">
                <input
                  className="w-full h-[52px] pl-4 pr-12 rounded-xl border border-outline-variant/60 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">alternate_email</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                <a className="text-xs font-bold text-primary hover:underline" href="#forgot">Forgot password?</a>
              </div>
              <div className="relative group">
                <input
                  className="w-full h-[52px] pl-4 pr-12 rounded-xl border border-outline-variant/60 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">lock</span>
              </div>
            </div>

            <div className="flex items-center px-1 py-1">
              <input
                className="w-4 h-4 text-primary bg-white border-outline-variant rounded focus:ring-primary focus:ring-offset-0"
                id="remember"
                type="checkbox"
              />
              <label className="ml-2 text-xs font-semibold text-on-surface-variant cursor-pointer" htmlFor="remember">Remember for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign in to SplitFlow</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-6 flex py-1.5 items-center">
            <div className="flex-grow border-t border-outline/10"></div>
            <span className="flex-shrink mx-4 text-outline text-xs">OR</span>
            <div className="flex-grow border-t border-outline/10"></div>
          </div>

          <button
            type="button"
            className="w-full h-[52px] bg-white border border-outline/20 text-on-surface rounded-xl text-xs font-bold flex items-center justify-center gap-3 hover:bg-surface-container-low active:scale-[0.99] transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            <span>Sign in with Google</span>
          </button>

          <p className="text-center text-xs text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">Create account</Link>
          </p>

          {/* Footer Terms */}
          <div className="text-center text-[10px] text-outline px-6">
            By signing in, you agree to our{' '}
            <a className="underline" href="#terms">Terms of Service</a> and{' '}
            <a className="underline" href="#privacy">Privacy Policy</a>.
          </div>
        </div>
      </section>
    </div>
  );
}
