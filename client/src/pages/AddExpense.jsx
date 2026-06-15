import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AddExpense() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Form fields
  const [groupId, setGroupId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
        if (res.data.length > 0) {
          setGroupId(res.data[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch groups');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // Update selected group details when groupId changes
  useEffect(() => {
    if (groupId) {
      const g = groups.find((x) => x.id === Number(groupId));
      setSelectedGroup(g || null);
      if (g && g.members && g.members.length > 0) {
        setPaidById(g.members[0].id.toString());
        setSelectedMemberIds(g.members.map(m => m.id));
      } else {
        setPaidById('');
        setSelectedMemberIds([]);
      }
    } else {
      setSelectedGroup(null);
      setPaidById('');
      setSelectedMemberIds([]);
    }
  }, [groupId, groups]);

  const handleToggleMember = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!groupId || !description || !amount || !paidById) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedMemberIds.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    setLoading(true);
    try {
      await api.post('/expenses', {
        groupId: Number(groupId),
        description,
        amount: Number(amount),
        paidById: Number(paidById),
        category,
        date,
      });
      navigate('/expenses');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const categoryOptions = [
    { name: 'Food', label: 'Food & Drink', icon: 'restaurant' },
    { name: 'Transport', label: 'Transport', icon: 'directions_bus' },
    { name: 'Bills', label: 'Utilities & Bills', icon: 'bolt' },
    { name: 'Entertainment', label: 'Entertainment', icon: 'movie' },
    { name: 'Shopping', label: 'Shopping', icon: 'shopping_bag' },
    { name: 'General', label: 'Others', icon: 'more_horiz' },
  ];

  return (
    <div className="max-w-4xl mx-auto fade-up">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl text-xs border border-error/20 flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-error">error</span>
          <span>{error}</span>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="glass-card p-8 text-center text-on-surface-variant flex flex-col items-center justify-center space-y-3">
          <span className="material-symbols-outlined !text-[48px] text-outline/35">groups</span>
          <h3 className="font-bold text-base">No groups available</h3>
          <p className="text-xs">You must create a group before you can log an expense.</p>
          <button onClick={() => navigate('/groups')} className="bg-primary text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-md mt-2">
            Go to Groups
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-card rounded-[24px] overflow-hidden shadow-2xl flex flex-col bg-white">
          {/* Header */}
          <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-[#f0ecf9]/30">
            <div>
              <h3 className="text-xl font-extrabold text-primary">Add New Expense</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Split costs with your group members seamlessly.</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: Form Details */}
            <div className="md:col-span-7 space-y-5">
              {/* Group selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant px-1 block">Target Community</label>
                <select
                  required
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-xs outline-none"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant px-1 block">What was it for?</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">shopping_cart</span>
                  <input
                    required
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs outline-none"
                    placeholder="e.g. Weekly Groceries, Pizza Dinner"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant px-1 block">How much?</label>
                  <div className="flex">
                    <div className="bg-[#eae6f4] px-4 py-2.5 rounded-l-xl border-y border-l border-outline-variant/60 flex items-center font-bold text-primary text-sm">
                      ₹
                    </div>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="flex-1 px-4 py-2.5 bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-r-xl text-xs outline-none font-bold"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant px-1 block">When?</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_today</span>
                    <input
                      required
                      type="date"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Paid By Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant px-1 block">Paid By</label>
                <select
                  required
                  className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-2.5 text-xs outline-none"
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  disabled={!selectedGroup}
                >
                  {selectedGroup && selectedGroup.members ? (
                    selectedGroup.members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  ) : (
                    <option value="">No members available</option>
                  )}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant px-1 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        category === cat.name
                          ? 'bg-primary/10 text-primary border-primary/25 shadow-sm'
                          : 'bg-[#fcf8ff] text-on-surface-variant border-outline-variant/30 hover:border-primary/45'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Type Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant px-1 block">Split Type</label>
                <div className="flex bg-[#e4e1ee]/50 p-1 rounded-xl border border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => setSplitType('equal')}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-all font-bold ${
                      splitType === 'equal' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('exact')}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-all font-bold ${
                      splitType === 'exact' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'
                    }`}
                    disabled
                    title="Exact split features pending"
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('percent')}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-all font-bold ${
                      splitType === 'percent' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'
                    }`}
                    disabled
                    title="Percent split features pending"
                  >
                    Percent
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Participants list */}
            <div className="md:col-span-5 flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant px-1 block">With whom? (Select Participants)</label>
              <div className="flex-1 bg-[#f0ecf9]/20 border border-outline-variant/20 rounded-xl overflow-hidden flex flex-col min-h-[250px]">
                <div className="p-2.5 border-b border-outline-variant/10 bg-white">
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Group members checklist</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                  {selectedGroup && selectedGroup.members ? (
                    selectedGroup.members.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer border ${
                          selectedMemberIds.includes(m.id)
                            ? 'bg-white border-primary/20'
                            : 'bg-transparent border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs uppercase">
                            {m.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">{m.name}</p>
                            <p className="text-[9px] text-on-surface-variant">Default: Share</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="w-4.5 h-4.5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                          checked={selectedMemberIds.includes(m.id)}
                          onChange={() => handleToggleMember(m.id)}
                        />
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant italic p-2">Select a group first</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Info / Save Actions */}
          <div className="p-6 border-t border-outline-variant/20 bg-[#f0ecf9]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[20px] text-outline">info</span>
              <span>Everyone in the group will be added immediately.</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-all cursor-pointer border border-outline-variant/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Save Expense</span>
                    <span className="material-symbols-outlined text-sm font-semibold">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
