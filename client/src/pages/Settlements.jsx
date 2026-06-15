import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Settlements() {
  const [suggestions, setSuggestions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  
  // Custom settlement form
  const [groupId, setGroupId] = useState('');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sugRes, setRes, groupRes] = await Promise.all([
        api.get('/settlements/suggested'),
        api.get('/settlements'),
        api.get('/groups'),
      ]);
      setSuggestions(sugRes.data);
      setSettlements(setRes.data);
      setGroups(groupRes.data);
      if (groupRes.data.length > 0) {
        setGroupId(groupRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update members list when groupId changes in form
  useEffect(() => {
    if (groupId) {
      const g = groups.find((x) => x.id === Number(groupId));
      if (g && g.members) {
        setMembers(g.members);
        if (g.members.length > 0) {
          setFromId(g.members[0].id.toString());
          setToId(g.members[1] ? g.members[1].id.toString() : g.members[0].id.toString());
        }
      } else {
        setMembers([]);
      }
    }
  }, [groupId, groups]);

  const handleLogSettlement = async (e) => {
    e.preventDefault();
    if (!groupId || !fromId || !toId || !amount) {
      alert('Please fill all required fields');
      return;
    }
    if (fromId === toId) {
      alert('Sender and receiver must be different people');
      return;
    }

    setSubmitLoading(true);
    try {
      await api.post('/settlements', {
        groupId: Number(groupId),
        fromId: Number(fromId),
        toId: Number(toId),
        amount: Number(amount),
        note,
      });
      setAmount('');
      setNote('');
      showToast('Settlement logged successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to log settlement');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSettleSuggested = async (sug) => {
    if (!window.confirm(`Settle suggested transfer of ₹${sug.amount} from ${sug.fromName} to ${sug.toName}?`)) return;
    try {
      await api.post('/settlements', {
        groupId: sug.groupId,
        fromId: sug.fromId,
        toId: sug.toId,
        amount: sug.amount,
        note: 'Settled from Auto-Suggestions',
      });
      showToast(`Settled ₹${sug.amount} transfer!`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to settle');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate receivables and payables for bento metrics
  const totalReceivables = suggestions.reduce((a, b) => a + b.amount, 0);
  const netStanding = totalReceivables; // Simplified for MVP

  return (
    <div className="space-y-6 fade-up">
      {/* Summary Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Standing */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between group hover:shadow-md transition-all border-l-4 border-primary shadow-sm relative overflow-hidden h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Balance</p>
              <h3 className="text-2xl font-black text-primary mt-2">₹ {netStanding.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant z-10 font-semibold">Net outstanding across all groups</p>
        </div>

        {/* You Are Owed */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between group hover:shadow-md transition-all border-l-4 border-secondary shadow-sm relative overflow-hidden h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">You are owed</p>
              <h3 className="text-2xl font-black text-[#00714d] mt-2">₹ {totalReceivables.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary">arrow_downward</span>
            </div>
          </div>
          <p className="text-[10px] text-secondary z-10 font-semibold">Calculated from ledger splits</p>
        </div>

        {/* You Owe */}
        <div className="glass-card p-6 rounded-xl flex flex-col justify-between group hover:shadow-md transition-all border-l-4 border-error shadow-sm relative overflow-hidden h-[150px]">
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">You owe</p>
              <h3 className="text-2xl font-black text-error mt-2">₹ 0.00</h3>
            </div>
            <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-error">arrow_upward</span>
            </div>
          </div>
          <p className="text-[10px] text-error z-10 font-semibold">Next payment due dynamically</p>
        </div>
      </section>

      {/* Main Grid Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Suggested Transfers */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h4 className="font-bold text-base text-on-surface">Suggested Settlements (Resolutions)</h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {suggestions.map((sug, i) => (
              <div key={i} className="glass-card p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 group hover:border-primary/30 transition-all duration-200 text-xs">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {sug.fromName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full border border-white"></span>
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface">{sug.fromName} owes {sug.toName}</h5>
                    <p className="text-[10px] text-secondary font-bold mt-0.5">₹ {sug.amount.toFixed(2)} ({sug.groupName})</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleSettleSuggested(sug)}
                    className="bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold text-[10px] px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Settle Up
                  </button>
                </div>
              </div>
            ))}

            {suggestions.length === 0 && (
              <div className="bg-[#6cf8bb]/15 border border-[#006c49]/20 p-8 rounded-xl text-center text-xs text-on-surface-variant space-y-1">
                <span className="material-symbols-outlined text-[#006c49] !text-[32px] !font-normal">check_circle</span>
                <p className="font-bold text-[#006c49]">All Balanced! No settlements suggestions.</p>
              </div>
            )}
          </div>

          {/* Record payment manually form inside layout */}
          <div className="glass-card p-6 rounded-xl space-y-4 bg-white">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              <span>Record a Payment Manually</span>
            </h4>
            
            {groups.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic">Create a group first to log settlements.</p>
            ) : (
              <form onSubmit={handleLogSettlement} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Choose Group</label>
                    <select
                      className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-3 py-2 outline-none"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Who Paid? (Debtor)</label>
                    <select
                      className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-3 py-2 outline-none"
                      value={fromId}
                      onChange={(e) => setFromId(e.target.value)}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Who Received? (Creditor)</label>
                    <select
                      className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-3 py-2 outline-none"
                      value={toId}
                      onChange={(e) => setToId(e.target.value)}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Amount (INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2 outline-none"
                      placeholder="₹ 0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface-variant mb-1">Note (Optional)</label>
                    <input
                      type="text"
                      className="w-full bg-[#fcf8ff] border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-2 outline-none"
                      placeholder="e.g. Bank Transfer Ref, cash"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-primary hover:bg-primary-container text-white disabled:opacity-50 font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Past Settlements */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="font-bold text-base text-on-surface">Pending / Past Settlements</h4>
          <div className="space-y-3">
            {settlements.map((set) => (
              <div key={set.id} className="glass-card p-4 rounded-xl space-y-2 border border-outline-variant/10 text-xs">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">payments</span>
                    </div>
                    <div>
                      <h6 className="font-bold text-on-surface truncate max-w-[150px]">{set.groupName}</h6>
                      <p className="text-[10px] text-on-surface-variant">{set.fromName} paid {set.toName}</p>
                    </div>
                  </div>
                  <span className="bg-[#6cf8bb]/20 text-[#00714d] px-2 py-0.5 rounded text-[8px] font-bold uppercase">Settled</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-outline-variant/10">
                  <span className="font-bold font-mono text-secondary">₹ {set.amount.toFixed(2)}</span>
                  <span className="text-[9px] text-outline">{set.date}</span>
                </div>
              </div>
            ))}

            {settlements.length === 0 && (
              <p className="text-xs text-on-surface-variant italic text-center py-8">No settlements recorded yet.</p>
            )}
          </div>
        </div>

      </section>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#302f39] text-[#f3effc] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-secondary">check_circle</span>
          <p className="text-xs font-bold">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
