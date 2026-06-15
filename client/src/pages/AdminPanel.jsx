import React, { useState, useEffect } from 'react';
import api from '../api';
import Icons from '../components/Icons';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch admin statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setActionMessage(`User role updated to ${newRole}`);
      setTimeout(() => setActionMessage(''), 3000);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update user role');
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('WARNING: This will wipe out ALL groups, expenses, imports, and settlements. This is intended to test the "all zero" slate. Proceed?')) return;
    try {
      const res = await api.post('/admin/reset');
      setActionMessage(res.data.message);
      setTimeout(() => setActionMessage(''), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to reset database');
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('This will seed the database with Flat 12B and Office Trip group expenses. Proceed?')) return;
    try {
      const res = await api.post('/admin/seed');
      setActionMessage(res.data.message);
      setTimeout(() => setActionMessage(''), 4000);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to seed database');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-6 rounded-2xl max-w-md mx-auto mt-10 space-y-3">
        <h3 className="font-bold text-lg">Access Denied</h3>
        <p className="text-sm">{error}</p>
        <p className="text-xs opacity-85">The Admin Panel is reserved for users with Group Admin / Admin status. Ensure your profile claims administrator credentials.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Admin Control Panel</h1>
        <p className="text-sm text-on-surface-variant">Global metrics management, user roles, database resets, and seeding.</p>
      </div>

      {actionMessage && (
        <div className="bg-secondary-container text-on-secondary-container border border-secondary/20 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
          <Icons.Check className="w-5 h-5 text-secondary flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl border border-white/20 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Users</span>
          <div className="text-2xl font-black text-on-surface mt-1">{stats?.users}</div>
        </div>
        <div className="glass p-4 rounded-xl border border-white/20 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Groups</span>
          <div className="text-2xl font-black text-on-surface mt-1">{stats?.groups}</div>
        </div>
        <div className="glass p-4 rounded-xl border border-white/20 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Expenses</span>
          <div className="text-2xl font-black text-on-surface mt-1">{stats?.expenses}</div>
        </div>
        <div className="glass p-4 rounded-xl border border-white/20 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Import Batches</span>
          <div className="text-2xl font-black text-on-surface mt-1">{stats?.imports}</div>
        </div>
      </div>

      {/* Database State Controllers */}
      <section className="glass p-6 rounded-2xl border border-white/20 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-on-surface flex items-center space-x-1.5">
          <Icons.Settings className="w-5 h-5 text-primary" />
          <span>Database State Operations</span>
        </h2>
        <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
          Toggle between a completely blank database to verify the "all zero" responsive behavior, or load pre-populated mock details (expenses, imports, settlements) to inspect calculations.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleResetDatabase}
            className="bg-error hover:bg-error/95 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
          >
            <Icons.Trash className="w-4 h-4" />
            <span>Reset Database to Clean Slate (All Zero)</span>
          </button>

          <button
            onClick={handleSeedDatabase}
            className="bg-primary hover:bg-primary-container text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
          >
            <Icons.Check className="w-4 h-4" />
            <span>Seed Database with Sample Data</span>
          </button>
        </div>
      </section>

      {/* User Manager */}
      <section className="glass p-6 rounded-2xl border border-white/20 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-on-surface flex items-center space-x-1.5">
          <Icons.Groups className="w-5 h-5 text-primary" />
          <span>User Profiles & Roles</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-outline font-bold text-xs uppercase">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 px-4">Email</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-on-surface">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low/50">
                  <td className="py-3 pr-4 font-bold flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-[10px] uppercase">
                      {u.avatar}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant font-mono text-xs">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-primary-fixed text-primary border border-primary-fixed-dim/20'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {u.role === 'admin' ? 'Group Admin' : 'Member'}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="text-primary hover:underline font-semibold text-xs"
                      title="Toggle role admin/member"
                    >
                      Toggle Privilege
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
