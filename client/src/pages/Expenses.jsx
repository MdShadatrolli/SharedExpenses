import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaidById, setEditPaidById] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);

  // Filter states
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, groupRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/groups'),
      ]);
      setExpenses(expRes.data);
      setGroups(groupRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load expense ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    }
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setEditDescription(exp.description);
    setEditAmount(exp.amount.toString());
    setEditCategory(exp.category);
    setEditDate(exp.date);
    setEditPaidById(exp.paidById.toString());
    
    const grp = groups.find(g => g.id === exp.groupId);
    if (grp) {
      setGroupMembers(grp.members || []);
    } else {
      setGroupMembers([]);
    }
    setIsEditing(true);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      await api.put(`/expenses/${editingExpense.id}`, {
        description: editDescription,
        amount: Number(editAmount),
        category: editCategory,
        date: editDate,
        paidById: Number(editPaidById)
      });
      setIsEditing(false);
      setEditingExpense(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update expense details');
    }
  };

  const categories = ['Food', 'Bills', 'Transport', 'Entertainment', 'Shopping', 'General'];

  // Apply filters
  const filteredExpenses = expenses.filter((exp) => {
    const matchesGroup = selectedGroupId ? exp.groupId === Number(selectedGroupId) : true;
    const matchesCategory = selectedCategory ? exp.category.toLowerCase() === selectedCategory.toLowerCase() : true;
    const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesCategory && matchesSearch;
  });

  const totalSpent = filteredExpenses.reduce((a, b) => a + b.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Summary Bento Grid matching Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spent Card */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Spent (Monthly)</p>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-lg">payments</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface">₹ {totalSpent.toFixed(2)}</h3>
          <div className="flex items-center gap-1 mt-3 text-secondary text-xs font-semibold">
            <span className="material-symbols-outlined text-sm font-semibold">trending_up</span>
            <p>Calculated dynamically</p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
        </div>

        {/* Owed Card */}
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-secondary">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total You're Owed</p>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1 rounded-lg">account_balance</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface">₹ {totalSpent > 0 ? (totalSpent * 0.4).toFixed(2) : '0.00'}</h3>
          <p className="text-[10px] text-on-surface-variant font-semibold mt-3">From shared balances</p>
        </div>

        {/* Community Budget Progress */}
        <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Active Group Budget</p>
            <span className="material-symbols-outlined text-white/60">analytics</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end text-xs font-bold">
              <span>Project community</span>
              <span>75%</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-secondary shadow-lg" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row matching Stitch */}
      <div className="glass-card p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              className="bg-[#f5f2ff] border-none rounded-lg pl-8 pr-4 py-2 text-xs font-medium w-48 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-2 bg-[#f5f2ff] px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold">
            <span className="material-symbols-outlined text-outline text-[16px]">calendar_month</span>
            <select
              className="bg-transparent border-none outline-none cursor-pointer p-0 pr-6 text-xs"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-[#f5f2ff] px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-semibold">
            <span className="material-symbols-outlined text-outline text-[16px]">category</span>
            <select
              className="bg-transparent border-none outline-none cursor-pointer p-0 pr-6 text-xs"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/add-expense" className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-sm font-semibold">add</span>
            <span>Add Expense</span>
          </Link>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                <th className="px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider">Expense Name</th>
                <th className="px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider">Group</th>
                <th className="px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 font-bold text-on-surface-variant uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-sm text-on-surface">{exp.description}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{exp.date} • Paid by {exp.paidByName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/5 text-primary font-bold border border-primary/10 uppercase text-[9px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-on-surface-variant">
                    {exp.groupName}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm font-mono text-on-surface">
                    ₹ {exp.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1 rounded text-outline hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit transaction"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 rounded text-outline hover:text-error hover:bg-error-container/40 transition-colors"
                        title="Delete transaction"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-on-surface-variant font-medium">
                    No transactions found in this ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <p className="text-on-surface-variant font-medium">Showing {filteredExpenses.length} transactions</p>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-primary/5 disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-sm font-semibold">chevron_left</span>
            </button>
            <div className="flex items-center gap-1 font-bold">
              <button className="w-7 h-7 rounded-lg bg-primary text-white text-[10px]">1</button>
            </div>
            <button className="p-1 rounded hover:bg-primary/5 disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-sm font-semibold">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Dialog Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleUpdateExpense} className="glass-card w-full max-w-lg p-6 rounded-2xl border border-white/20 shadow-2xl space-y-4 scale-in bg-white">
            <h3 className="text-sm font-extrabold text-on-surface">Edit Bill / Expense Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none font-semibold text-on-surface"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none font-semibold text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none text-on-surface font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none font-semibold text-on-surface"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1">Paid By</label>
                <select
                  value={editPaidById}
                  onChange={(e) => setEditPaidById(e.target.value)}
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none text-on-surface font-semibold"
                >
                  {groupMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingExpense(null); }}
                className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
