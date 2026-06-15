import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');

  // Fetch functions
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupDetail = async (id) => {
    try {
      const res = await api.get(`/groups/${id}`);
      setSelectedGroup(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load group details');
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const handleSelectMember = (userId) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleAddNewMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      const res = await api.post('/users', { name: newMemberName });
      const newUser = res.data;
      setAllUsers(prev => [...prev, newUser]);
      setSelectedMemberIds(prev => [...prev, newUser.id]);
      setNewMemberName('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to add member name');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.post('/groups', {
        name,
        currency,
        memberIds: selectedMemberIds,
      });
      setName('');
      setCurrency('INR');
      setSelectedMemberIds([]);
      setIsCreating(false);
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Failed to create group');
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!name) return;
    try {
      await api.put(`/groups/${selectedGroup.id}`, {
        name,
        currency,
        memberIds: selectedMemberIds,
      });
      setIsEditing(false);
      fetchGroupDetail(selectedGroup.id);
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Failed to edit group');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group? All expenses will be deleted.')) return;
    try {
      await api.delete(`/groups/${id}`);
      setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Failed to delete group');
    }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expId}`);
      if (selectedGroup) {
        fetchGroupDetail(selectedGroup.id);
      }
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    }
  };

  const openEditForm = () => {
    setName(selectedGroup.name);
    setCurrency(selectedGroup.currency);
    setSelectedMemberIds(selectedGroup.memberIds || selectedGroup.members.map((m) => m.id));
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getGroupIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('flat') || n.includes('room') || n.includes('apartment')) return 'apartment';
    if (n.includes('trip') || n.includes('travel') || n.includes('office')) return 'flight_takeoff';
    return 'restaurant';
  };

  const getGroupIconColor = (name) => {
    const icon = getGroupIcon(name);
    if (icon === 'apartment') return 'text-primary bg-primary/5 border-primary/10';
    if (icon === 'flight_takeoff') return 'text-secondary bg-secondary/5 border-secondary/10';
    return 'text-tertiary bg-tertiary/5 border-tertiary/10';
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-primary tracking-tight leading-none">
            {selectedGroup ? selectedGroup.name : 'Financial Communities'}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1.5">
            {selectedGroup ? 'Detailed balances and expense logs.' : 'Manage and track shared expenses with your groups.'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedGroup ? (
            <>
              <button
                onClick={() => setSelectedGroup(null)}
                className="bg-white hover:bg-surface-container-high border border-outline-variant/60 text-on-surface px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Back to list</span>
              </button>
              <button
                onClick={openEditForm}
                className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Edit Group</span>
              </button>
              <button
                onClick={() => handleDeleteGroup(selectedGroup.id)}
                className="bg-error hover:bg-error/90 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">group_add</span>
                <span>+ New Group</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Container */}
      {!selectedGroup ? (
        // LIST VIEW
        <>
          {isCreating && (
            <form onSubmit={handleCreateGroup} className="glass-card p-6 rounded-2xl border border-white/20 shadow-lg space-y-4 max-w-2xl scale-in bg-white">
              <h3 className="text-base font-extrabold text-on-surface">Create New Split Group</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-outline mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none"
                    placeholder="e.g. Roommates Flat 3B"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-outline mb-1">Currency</label>
                  <select
                    className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-outline mb-1.5">Select Members</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectMember(user.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-[11px] transition-all ${
                        selectedMemberIds.includes(user.id)
                          ? 'bg-primary-fixed border-primary text-primary font-bold'
                          : 'bg-white border-outline-variant/40 hover:bg-[#f0ecf9]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-outline-variant/60 text-on-surface flex items-center justify-center font-bold text-[9px] uppercase">
                        {user.avatar}
                      </div>
                      <span className="truncate">{user.name}</span>
                    </button>
                  ))}
                </div>

                {/* Inline Member Creator */}
                <div className="flex gap-2 items-center mt-3 p-2 bg-[#f5f2ff] rounded-xl border border-outline-variant/30">
                  <input
                    type="text"
                    placeholder="Add new person (e.g. Rohan)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="flex-1 bg-white border border-outline-variant/50 focus:border-primary rounded-lg px-3 py-1.5 text-xs outline-none text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewMember}
                    className="bg-secondary hover:brightness-110 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    + Add Person
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {groups.length === 0 ? (
            <div className="glass-card p-12 text-center text-on-surface-variant flex flex-col items-center justify-center space-y-3">
              <span className="material-symbols-outlined !text-[56px] text-outline/35">groups</span>
              <h3 className="font-extrabold text-base">No groups created yet</h3>
              <p className="text-xs max-w-sm">Create a group to start tracking shared utility bills, rent, dinner expenses, or trip costs dynamically.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-primary-container text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-md mt-2"
              >
                Create First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => fetchGroupDetail(group.id)}
                  className="glass-card rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-xl duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getGroupIconColor(group.name)}`}>
                      <span className="material-symbols-outlined text-[28px]">{getGroupIcon(group.name)}</span>
                    </div>
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full border-2 border-white bg-primary-fixed text-primary flex items-center justify-center font-bold text-[9px] uppercase"
                          title={m.name}
                        >
                          {m.avatar}
                        </div>
                      ))}
                      {group.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-surface-container-highest border-2 border-white flex items-center justify-center text-[8px] font-bold">
                          +{group.members.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-on-surface truncate">{group.name}</h4>
                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1 font-semibold">
                      <span className="material-symbols-outlined text-[14px]">group</span> {group.members.length} Members
                    </p>
                  </div>

                  <div className="flex justify-between items-end border-t border-outline-variant/20 pt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Total Expenses</span>
                      <span className="font-bold text-sm text-on-surface">₹ {group.expenseCount * 1200}.00</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-[#006c49] font-bold uppercase tracking-wider">Calculated standing</span>
                      <span className="font-bold text-xs text-[#006c49]">{group.currency}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between text-[9px] font-bold text-on-surface-variant">
                      <span>BUDGET UTILIZATION</span>
                      <span>{60 + (group.id * 10)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#e4e1ee] rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${60 + (group.id * 10)}%` }}></div>
                    </div>
                  </div>

                  <button className="mt-2 w-full py-2.5 rounded-xl font-bold text-xs border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1">
                    <span>View Details</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Inactive Suggestions Mockup Section to complete fidelity */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-on-surface-variant">archive</span>
              <h3 className="font-bold text-base text-on-surface">Suggested to Archive</h3>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden text-xs">
              <div className="p-4 bg-[#f0ecf9]/50 border-b border-outline-variant/20 text-on-surface-variant font-medium">
                These groups haven't had activity in over 60 days. Archiving them will keep your workspace clean.
              </div>
              <div className="divide-y divide-outline-variant/10">
                <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e4e1ee] flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">celebration</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-on-surface">Birthday Bash 2025</h5>
                      <p className="text-[10px] text-on-surface-variant">Last active: Dec 12, 2025 • 12 members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-on-surface-variant italic">All Settled</span>
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-all rounded-lg hover:bg-primary/10">
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        // DETAILED GROUP VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Dialog Modal Backdrop */}
          {isEditing && (
            <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <form onSubmit={handleEditGroup} className="glass-card w-full max-w-xl p-6 rounded-2xl border border-white/20 shadow-2xl space-y-4 scale-in bg-white">
                <h3 className="text-base font-bold text-on-surface">Edit Group Details</h3>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-outline mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-outline mb-1">Currency</label>
                  <select
                    className="w-full bg-white border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2.5 text-xs outline-none"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-outline mb-1.5">Select Members</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectMember(user.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                          selectedMemberIds.includes(user.id)
                            ? 'bg-primary-fixed border-primary text-primary font-bold'
                            : 'bg-white border-outline-variant/40 hover:bg-[#f0ecf9]'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-outline-variant text-on-surface flex items-center justify-center font-bold text-[10px]">
                          {user.avatar}
                        </div>
                        <span className="truncate">{user.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Inline Member Creator */}
                  <div className="flex gap-2 items-center mt-3 p-2 bg-[#f5f2ff] rounded-xl border border-outline-variant/30">
                    <input
                      type="text"
                      placeholder="Add new person (e.g. Rohan)"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="flex-1 bg-white border border-outline-variant/50 focus:border-primary rounded-lg px-3 py-1.5 text-xs outline-none text-on-surface"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewMember}
                      className="bg-secondary hover:brightness-110 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      + Add Person
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Left panel: Balance Sheet and Member Listing */}
          <div className="space-y-6">
            {/* Balances */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                <span className="material-symbols-outlined text-primary text-lg">payments</span>
                <span>Balances Overview</span>
              </h2>

              <div className="space-y-2.5">
                {selectedGroup.balances && selectedGroup.balances.length > 0 ? (
                  selectedGroup.balances.map((b) => (
                    <div key={b.userId} className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-white border border-outline-variant/20">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-extrabold text-[9px] uppercase">
                          {b.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-on-surface font-semibold">{b.name}</span>
                      </div>
                      <span className={`font-mono font-bold ${b.balance > 0 ? 'text-[#006c49]' : b.balance < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                        {b.balance > 0 ? `+${b.balance.toFixed(2)}` : b.balance.toFixed(2)} {selectedGroup.currency}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No balances computed.</p>
                )}
              </div>
            </div>

            {/* Member Details */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                <span className="material-symbols-outlined text-primary text-lg">group</span>
                <span>Members ({selectedGroup.members.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {selectedGroup.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-xl transition-all text-xs">
                    <div className="h-7 w-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-[10px]">
                      {m.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface truncate">{m.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Expense Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">receipt_long</span>
                  <span>Expense Ledger</span>
                </h2>
                <span className="text-[10px] font-mono font-bold bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-md">
                  {selectedGroup.expenses.length} Records
                </span>
              </div>

              {selectedGroup.expenses.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant flex flex-col items-center justify-center space-y-2">
                  <span className="material-symbols-outlined !text-[48px] text-outline/35">receipt</span>
                  <p className="font-bold text-xs">No expenses logged in this group.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {selectedGroup.expenses.map((exp) => (
                    <div key={exp.id} className="p-3 bg-white border border-outline-variant/20 hover:border-outline-variant/40 rounded-xl flex items-center justify-between gap-4 text-xs transition-all">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold flex-shrink-0">
                          <span className="material-symbols-outlined text-sm">
                            {exp.category === 'Food' ? 'restaurant' : exp.category === 'Bills' ? 'bolt' : exp.category === 'Transport' ? 'local_taxi' : 'receipt'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface truncate">{exp.description}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            Paid by <span className="font-bold">{exp.paidByName}</span>
                          </p>
                          <span className="text-[9px] text-outline">{exp.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-on-surface block">
                            ₹ {exp.amount.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-outline hover:text-error hover:bg-error-container/40 rounded-lg transition-all"
                          title="Delete Expense"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
