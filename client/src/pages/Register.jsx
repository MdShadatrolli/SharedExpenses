import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side: Visual/Branding Section */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary-container overflow-hidden items-center justify-center">
        {/* Animated Ambient Background Simulation */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary-container rounded-full filter blur-[120px] opacity-40 animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary rounded-full filter blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="noise-overlay absolute inset-0"></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 p-10 flex flex-col items-start max-w-xl text-white space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-primary-container !text-[40px] !font-normal">account_balance_wallet</span>
            <h1 className="text-3xl font-extrabold tracking-tighter">SplitFlow</h1>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight">Elevate your group finances with Luminous Ledger.</h2>
          <p className="text-on-primary-container/90 text-sm leading-relaxed">
            Experience the precision of enterprise-grade splitting. Seamlessly manage shared expenses, track group balances, and settle up with crystalline clarity.
          </p>
          
          {/* Collaboration Visual (Bento-like Preview) */}
          <div className="grid grid-cols-2 gap-6 w-full pt-4">
            <div className="glass-panel p-4 rounded-xl shadow-lg transform -rotate-2 text-on-surface">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-fixed text-sm">group</span>
                </div>
                <span className="text-xs font-bold text-[#1b1b24]">Team Dinner</span>
              </div>
              <div className="text-primary font-black text-xl">₹ 1,425.00</div>
            </div>
            <div className="glass-panel p-4 rounded-xl shadow-lg transform rotate-3 translate-y-4 text-on-surface">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">receipt_long</span>
                <span className="text-xs font-bold text-[#1b1b24]">Office Rent</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mt-2">
                <div className="bg-secondary h-full rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Image overlay */}
        <div className="absolute inset-0 -z-10 opacity-40">
          <img
            alt="Corporate Teamwork"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg5gOjHgpCN25ecHsyymfvDbB-acIJzjK15844Gs7niTeUhhvBer_NC1ftjR7V8Lm8HvWWY3cv7qg5zUoiLGvkFuE9LWvCTha3kopwUbzs0b2_X6dmNJnzPqkrlcKG_rSVQPf4VzD9S-juN2mB6ou_dZP0zcCV97Nskm06vGeLnoKPLZ3n5Ej0DLQaEODXhBlWJCxrwqIODBPEAKQl-V59Oru6ONrgsPgP838l8IynmCWvlBiT1ld2f2BCi9BN2NgaRLgfgDgkaXMO"
          />
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <main className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-6 md:p-10 overflow-y-auto">
        {/* Header/Logo for Mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary !text-[32px] !font-normal">account_balance_wallet</span>
          <span className="text-2xl font-extrabold text-primary tracking-tighter">SplitFlow</span>
        </div>

        {/* Form Container */}
        <div className="max-w-md mx-auto w-full flex-grow flex flex-col justify-center py-6">
          <header className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface">Create Account</h2>
            <p className="text-xs text-on-surface-variant">Start splitting expenses with precision and ease.</p>
          </header>

          {error && (
            <div className="bg-error-container text-on-error-container border border-error/20 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 mb-4">
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-secondary-container text-on-secondary-container border border-secondary/20 px-4 py-3 rounded-xl text-xs flex items-center space-x-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="full_name">Full Name</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                <input
                  className="w-full bg-[#f5f2ff] border border-outline-variant/60 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
                  id="full_name"
                  placeholder="Vikash Kumar"
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="email">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                <input
                  className="w-full bg-[#f5f2ff] border border-outline-variant/60 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
                  id="email"
                  placeholder="name@company.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="password">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="w-full bg-[#f5f2ff] border border-outline-variant/60 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
                  id="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant block ml-1" htmlFor="confirm_password">Confirm Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">verified_user</span>
                <input
                  className="w-full bg-[#f5f2ff] border border-outline-variant/60 rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-all"
                  id="confirm_password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-white text-xs font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline ml-1">Login here</Link>
            </p>
          </div>
        </div>

        {/* Legal Footer */}
        <footer className="mt-auto pt-6 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-outline">© 2026 SplitFlow. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <a className="text-[10px] text-on-surface-variant hover:text-primary transition-colors" href="#terms">Terms of Service</a>
            <a className="text-[10px] text-on-surface-variant hover:text-primary transition-colors" href="#privacy">Privacy Policy</a>
            <a className="text-[10px] text-on-surface-variant hover:text-primary transition-colors" href="#cookies">Cookie Settings</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
