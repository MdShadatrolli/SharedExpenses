import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container border border-error/10 p-6 rounded-2xl flex items-center space-x-4 max-w-lg mx-auto mt-10">
        <span className="material-symbols-outlined text-error text-[32px] !font-normal">error</span>
        <div>
          <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
          <p className="text-sm opacity-90">{error}</p>
          <button onClick={fetchDashboard} className="mt-2 bg-error text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-error/90 transition-all">Retry</button>
        </div>
      </div>
    );
  }

  const { totalReceivable = 0, totalPayable = 0, netBalance = 0, groupBalances = [], recentExpenses = [], monthlySpend = [] } = data || {};

  // Compute category shares for chart
  const categoryMap = {};
  recentExpenses.forEach(exp => {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  });
  const totalCatExpenses = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
  const categoriesList = Object.entries(categoryMap).map(([cat, amt]) => ({
    name: cat,
    amount: amt,
    percent: Math.round((amt / totalCatExpenses) * 100)
  })).sort((a,b) => b.amount - a.amount);

  const maxMonthlyAmount = Math.max(...monthlySpend.map(m => m.amount)) || 1;

  // Compute circle sectors
  let accumulatedPercent = 0;
  const circles = categoriesList.map((cat, i) => {
    const percent = cat.percent;
    const offset = accumulatedPercent;
    accumulatedPercent += percent;
    
    const strokeColor = i === 0 ? '#3525cd' : i === 1 ? '#006c49' : i === 2 ? '#95002b' : '#777587';
    return (
      <circle
        key={cat.name}
        cx="18"
        cy="18"
        fill="transparent"
        r="16"
        stroke={strokeColor}
        strokeDasharray={`${percent} 100`}
        strokeDashoffset={-offset}
        strokeWidth="4"
        className="transition-all duration-500"
      />
    );
  });

  return (
    <div className="space-y-6 fade-up">
      {/* Summary Cards Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Balance */}
        <div className="glass-card p-6 rounded-xl relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Net Balance</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-1 rounded-lg">account_balance</span>
          </div>
          <h3 className={`text-3xl font-black ${netBalance >= 0 ? 'text-primary' : 'text-error'}`}>
            ₹ {netBalance.toFixed(2)}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-secondary text-xs">
            <span className="material-symbols-outlined text-sm font-semibold">trending_up</span>
            <span className="font-semibold">Dynamic standing</span>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-5 text-primary">
            <span className="material-symbols-outlined !text-[80px]">payments</span>
          </div>
        </div>

        {/* Receivables */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Owed To You</span>
            <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1 rounded-lg">call_received</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface">
            ₹ {totalReceivable.toFixed(2)}
          </h3>
          <div className="mt-4 text-on-surface-variant text-xs font-semibold">
            From shared group balances
          </div>
        </div>

        {/* Payables */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total You Owe</span>
            <span className="material-symbols-outlined text-error bg-error/10 p-1 rounded-lg">call_made</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface">
            ₹ {totalPayable.toFixed(2)}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-error text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Unsettled ledger entries</span>
          </div>
        </div>
      </section>

      {/* Visual Analytics Bento Section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Spending Trend Chart */}
        <div className="lg:col-span-3 glass-card p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-base text-on-surface">Monthly Spending Trend</h4>
            <div className="flex items-center gap-2 bg-[#f0ecf9] p-1 rounded-lg text-[10px]">
              <button className="px-3 py-1 font-bold rounded-md bg-primary text-white shadow-sm">Bar</button>
              <button className="px-3 py-1 font-bold rounded-md hover:bg-primary/5 text-on-surface-variant transition-colors">Line</button>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {/* Render dynamic spending bars from actual database values */}
            {monthlySpend.map((m) => {
              const heightPercent = Math.max(5, Math.round((m.amount / maxMonthlyAmount) * 100));
              return (
                <div 
                  key={m.label} 
                  className="w-full bg-primary/10 rounded-t-lg relative group transition-all duration-500" 
                  style={{ height: `${heightPercent}%` }}
                  title={`${m.label}: ₹ ${m.amount}`}
                >
                  <div className="absolute inset-0 bg-primary/20 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom rounded-t-lg"></div>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1b1b24] text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow pointer-events-none whitespace-nowrap z-10">
                    ₹ {m.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between px-2 text-on-surface-variant font-semibold text-[10px]">
            {monthlySpend.map((m) => (
              <span key={m.label}>{m.label}</span>
            ))}
          </div>
        </div>

        {/* Category Split Circle Graph */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
          <h4 className="font-bold text-base text-on-surface">Category Split</h4>
          <div className="relative flex items-center justify-center h-48">
            {/* SVG Donut Chart */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="16" stroke="#e4e1ee" strokeWidth="4"></circle>
              {circles}
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-bold text-on-surface">Expenses</span>
              <span className="text-[10px] text-on-surface-variant font-semibold">Ledger Categories</span>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            {categoriesList.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-secondary' : 'bg-tertiary'}`}></div>
                  <span className="text-on-surface-variant">{cat.name}</span>
                </div>
                <span className="font-bold">{cat.percent}%</span>
              </div>
            ))}
            {categoriesList.length === 0 && (
              <p className="text-[10px] text-on-surface-variant italic text-center py-2">Add expenses to show division percentages.</p>
            )}
          </div>
        </div>
      </section>

      {/* Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Group Balances */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
            <h4 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              <span>Group Balance sheets</span>
            </h4>
            <Link to="/groups" className="text-primary hover:underline text-xs font-bold">View All Groups</Link>
          </div>

          {groupBalances.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant flex flex-col items-center justify-center space-y-2">
              <span className="material-symbols-outlined !text-[48px] text-outline/35">groups</span>
              <p className="font-bold text-sm">No group balances to display.</p>
              <Link to="/groups" className="text-xs bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1.5 rounded-lg transition-all mt-2">
                Create Group
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {groupBalances.map((group) => (
                <div key={group.groupId} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5">
                    <span className="font-bold text-sm text-on-surface">{group.groupName}</span>
                    <span className="text-[10px] font-bold font-mono bg-primary-fixed text-primary px-2 py-0.5 rounded-md">{group.currency}</span>
                  </div>
                  <div className="space-y-1.5">
                    {group.balances.map((b) => (
                      <div key={b.userId} className="flex justify-between items-center">
                        <span className="text-on-surface-variant font-medium">{b.name}</span>
                        <span className={`font-mono font-bold ${b.balance > 0 ? 'text-secondary' : b.balance < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                          {b.balance > 0 ? `+${b.balance.toFixed(2)}` : b.balance.toFixed(2)} {group.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity log */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
            <h4 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <span>Recent Activity</span>
            </h4>
            <Link to="/expenses" className="text-primary hover:underline text-xs font-bold">View Ledger</Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant flex flex-col items-center justify-center space-y-2">
              <span className="material-symbols-outlined !text-[48px] text-outline/35">receipt</span>
              <p className="text-xs font-bold">No transactions logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-start gap-3 pb-3 border-b border-outline-variant/20 last:border-b-0 last:pb-0 text-xs">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-sm">
                      {exp.category === 'Food' ? 'restaurant' : exp.category === 'Bills' ? 'bolt' : exp.category === 'Transport' ? 'local_taxi' : 'receipt'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface truncate">{exp.description}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {exp.groupName} • Paid by {exp.paidByName}
                    </p>
                    <p className="text-[9px] text-outline mt-0.5">{exp.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-on-surface block">
                      ₹ {exp.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link to="/add-expense" className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-200 z-50 flex items-center justify-center group">
        <span className="material-symbols-outlined !text-[28px] !font-normal">add</span>
      </Link>
    </div>
  );
}
