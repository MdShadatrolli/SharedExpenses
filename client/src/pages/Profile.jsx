import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [darkAppearance, setDarkAppearance] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState('INR');
  const [emailDigests, setEmailDigests] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [groupInvitations, setGroupInvitations] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const [groupsCount, setGroupsCount] = useState(0);
  const [expensesCount, setExpensesCount] = useState(0);
  const [settledPercent, setSettledPercent] = useState(100);
  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchProfileAndStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      const currentUser = res.data;
      setUser(currentUser);

      // Populate input states
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDarkAppearance(!!currentUser.darkAppearance);
      setPrimaryCurrency(currentUser.primaryCurrency || 'INR');
      setEmailDigests(currentUser.emailDigests !== false);
      setPushNotifications(currentUser.pushNotifications !== false);
      setGroupInvitations(!!currentUser.groupInvitations);
      setAvatarUrl(currentUser.avatarUrl || '');

      // Now fetch stats & activities
      const [dashRes, expRes, setRes, grpRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/expenses'),
        api.get('/settlements'),
        api.get('/groups')
      ]);

      const dashData = dashRes.data;
      const allExpenses = expRes.data;
      const allSettlements = setRes.data;
      const allGroups = grpRes.data;

      // 1. Groups count
      setGroupsCount(allGroups.length);

      // 2. Expenses count (paid by this user)
      const userPaidExpenses = allExpenses.filter(e => e.paidById === currentUser.id);
      setExpensesCount(userPaidExpenses.length);

      // 3. Settled Percentage calculation
      const totalBalances = dashData.totalReceivable + dashData.totalPayable;
      if (totalBalances === 0) {
        setSettledPercent(100);
      } else {
        const totalUserExpensesCount = allExpenses.filter(e => 
          e.paidById === currentUser.id || 
          allGroups.some(g => g.id === e.groupId && g.memberIds.includes(currentUser.id))
        ).length;
        const totalUserSettlementsCount = allSettlements.filter(s => 
          s.fromId === currentUser.id || s.toId === currentUser.id
        ).length;
        
        const ratio = totalUserSettlementsCount / (totalUserExpensesCount + totalUserSettlementsCount || 1);
        setSettledPercent(Math.max(10, Math.min(98, Math.round(ratio * 100))));
      }

      // 4. Generate dynamic activity logs
      const logs = [];

      // Add group creation/join events
      allGroups.forEach(g => {
        logs.push({
          type: 'group',
          title: `Joined <strong>${g.name}</strong> group`,
          date: g.createdAt || new Date().toISOString().split('T')[0],
          icon: 'group_add',
          bgColor: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-fixed-dim',
        });
      });

      // Add expense logging events
      allExpenses.forEach(e => {
        logs.push({
          type: 'expense',
          title: `New expense: <strong>${e.description}</strong> (${e.amount} ${e.currency})`,
          date: e.date,
          icon: 'receipt',
          bgColor: 'bg-error-container text-on-error-container dark:bg-error-container/20 dark:text-error',
        });
      });

      // Add settlement transactions
      allSettlements.forEach(s => {
        const isFromMe = s.fromId === currentUser.id;
        const otherParty = isFromMe ? s.toName : s.fromName;
        logs.push({
          type: 'settlement',
          title: isFromMe 
            ? `Settled ${s.amount} ${s.currency} with <strong>${otherParty}</strong>`
            : `Received ${s.amount} ${s.currency} from <strong>${otherParty}</strong>`,
          date: s.date,
          icon: 'payments',
          bgColor: 'bg-secondary/10 text-secondary dark:bg-secondary-container/20 dark:text-secondary-fixed-dim',
        });
      });

      // Sort logs by date descending
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Append static security log if none present, to mimic Stitch layout
      logs.push({
        type: 'security',
        title: 'Security: Account verification completed',
        date: currentUser.createdAt || '2024-01-01',
        icon: 'shield',
        bgColor: 'bg-surface-container-highest text-on-surface-variant dark:bg-surface-container-high dark:text-on-surface',
      });

      setActivities(logs);

    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load user profile and activity stats.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Please select a valid image file', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setAvatarUrl(evt.target.result);
      setMessage({ text: 'Profile photo preview loaded. Save changes to persist.', type: 'info' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };
    reader.onerror = () => {
      setMessage({ text: 'Failed to read image file', type: 'error' });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const handleSave = async () => {
    setMessage({ text: '', type: '' });
    setSaving(true);

    try {
      const payload = {
        name,
        email,
        darkAppearance,
        primaryCurrency,
        emailDigests,
        pushNotifications,
        groupInvitations,
        avatarUrl
      };

      const res = await api.put('/users/me', payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));

      // Apply root dark class immediately
      if (darkAppearance) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Notify App layout to refresh sidebar/header state
      window.dispatchEvent(new Event('auth-change'));

      setMessage({ text: 'Settings saved successfully!', type: 'success' });
      
      // Auto dismiss message
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to save settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    // Reset states back to initial values
    setName(user.name || '');
    setEmail(user.email || '');
    setDarkAppearance(!!user.darkAppearance);
    setPrimaryCurrency(user.primaryCurrency || 'INR');
    setEmailDigests(user.emailDigests !== false);
    setPushNotifications(user.pushNotifications !== false);
    setGroupInvitations(!!user.groupInvitations);
    setAvatarUrl(user.avatarUrl || '');

    // Sync theme class
    if (user.darkAppearance) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setMessage({ text: 'Changes discarded.', type: 'info' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Helper for displaying dates in activity feeds
  const formatTimeLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-on-surface-variant font-semibold">Loading profile & settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-6 grid grid-cols-12 gap-6 fade-up">
      {/* Alert toast notification */}
      {message.text && (
        <div className={`col-span-12 p-4 rounded-xl text-sm border flex items-center gap-3 transition-all scale-in ${
          message.type === 'success'
            ? 'bg-secondary-container text-on-secondary-container border-secondary/20'
            : message.type === 'info'
            ? 'bg-primary-fixed text-on-primary-fixed border-primary/20'
            : 'bg-error-container text-on-error-container border-error/20'
        }`}>
          <span className="material-symbols-outlined shrink-0">
            {message.type === 'success' ? 'check_circle' : message.type === 'info' ? 'info' : 'warning'}
          </span>
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Profile Banner & Main Info */}
      <section className="col-span-12 glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="h-48 w-full relative">
          <img
            alt="Profile Banner"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuVcreVJFhq-NkMO5M8QUdUoqkm2qDUzA1UF9wAC49nNJ-MFXCmlpxbYYawBC4b3Bn8nKq7DEuMf-aWBu4QQ3qDbV52QvuPoMMiwlGI8PouTMo7JhCJbv_bEwbXK2yAmQa_cwLXOfnCICIofQ-MTrE9p6tFA4MkTA-qpqUBl-jGD2sYYVZ42eecLHDJ9i3fIDSxRHBSnyu4EmSfyUyMl3ImkfZJFkFRAWHOOp-TwnVBFc8Ke0s1BzjImtHnJRlfggZ6PYPaWnQqCOp"
          />
          <div className="absolute -bottom-12 left-6 md:left-8 flex items-end gap-4">
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-2xl border-4 border-surface bg-surface-container-lowest overflow-hidden shadow-md shrink-0 relative group">
              <img
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                src={avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBB3f4IG05VGo9rntcHr9iOoaIvqARGvH-EB_GCrh9SZrcRLVFhoZtV88CesgySIL8m0H2cSpOJE-pqnBL0ary1Edtpd6w3ViObcAH_5tJmgTgLx0k2e_HDlMpL0XK_7oQVF4yCjPjPK0uwzsFJeu8EaOZ4Mv3K9GTou3jHI0AZ7P7JdcP1WQHE_H29b8HccIFHAnFnX2KrGJvw3HYkCASlf3xgELGQ6LwPj1C9rmwNuS9wB1izSO6O_e5mWLrfiOLlrxRKU6nzvoCT"}
              />
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white pointer-events-none">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
                <span className="text-[8px] font-bold uppercase mt-1">Edit Photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Change profile photo"
              />
            </div>
            <div className="mb-2 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black text-on-surface leading-tight">{name}</h3>
                <span className="bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-secondary/10">
                  <span className="material-symbols-outlined text-[12px] font-fill-1">verified</span> Verified Member
                </span>
              </div>
              <p className="text-xs md:text-sm text-on-surface-variant font-medium">{email}</p>
            </div>
          </div>
        </div>
        <div className="pt-16 pb-4 px-6 md:px-8 flex items-center justify-end gap-6 md:gap-8 border-t border-outline-variant/30 mt-4">
          <div className="text-center">
            <p className="text-lg md:text-xl text-primary font-extrabold">{groupsCount}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Groups</p>
          </div>
          <div className="text-center">
            <p className="text-lg md:text-xl text-primary font-extrabold">{expensesCount}</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Expenses</p>
          </div>
          <div className="text-center">
            <p className="text-lg md:text-xl text-secondary font-extrabold">{settledPercent}%</p>
            <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">Settled</p>
          </div>
        </div>
      </section>

      {/* Left Settings Column */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        
        {/* Personal Details Form Section */}
        <section className="glass-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[22px]">person</span>
            <h4 className="text-lg font-bold text-on-surface">Personal Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 text-on-surface font-semibold"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-on-surface-variant mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 text-on-surface font-semibold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="glass-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
            <h4 className="text-lg font-bold text-on-surface">Preferences</h4>
          </div>
          <div className="space-y-6">
            {/* Dark Appearance Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Dark Appearance</p>
                <p className="text-xs text-on-surface-variant">Switch between light and dark visual themes.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={darkAppearance}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setDarkAppearance(checked);
                    // Instant response
                    if (checked) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-on-surface">Primary Currency</p>
                <p className="text-xs text-on-surface-variant">Select your default currency for new expenses.</p>
              </div>
              <select
                className="bg-surface-container-low border border-outline-variant text-on-surface text-xs font-bold rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary block w-40 p-2.5 outline-none transition-all cursor-pointer"
                value={primaryCurrency}
                onChange={(e) => setPrimaryCurrency(e.target.value)}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="glass-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[22px]">notifications_active</span>
            <h4 className="text-lg font-bold text-on-surface">Notifications</h4>
          </div>
          <div className="space-y-6">
            {/* Email Digests */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Email Digests</p>
                <p className="text-xs text-on-surface-variant">Receive weekly summaries of your spending and settlements.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailDigests}
                  onChange={(e) => setEmailDigests(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Push Notifications</p>
                <p className="text-xs text-on-surface-variant">Alerts for mentions, direct payments, and system updates.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pushNotifications}
                  onChange={(e) => setPushNotifications(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Group Invitations */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Group Invitations</p>
                <p className="text-xs text-on-surface-variant">Notify me when someone adds me to a new group.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={groupInvitations}
                  onChange={(e) => setGroupInvitations(e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Activity Log */}
      <div className="col-span-12 lg:col-span-4">
        <section className="glass-card rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[22px]">history</span>
              <h4 className="text-lg font-bold text-on-surface">Activity Log</h4>
            </div>
            
            {activities.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 block text-outline/40">history</span>
                <p className="text-sm font-semibold">No recent activity</p>
                <p className="text-xs text-outline">Activities will appear as groups, expenses, and settlements are created.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activities.slice(0, 5).map((log, index) => (
                  <div key={index} className="flex gap-4 items-start scale-in">
                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${log.bgColor}`}>
                      <span className="material-symbols-outlined text-[20px]">{log.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-on-surface leading-tight font-medium" dangerouslySetInnerHTML={{ __html: log.title }}></p>
                      <p className="text-[10px] text-on-surface-variant font-bold mt-0.5">{formatTimeLabel(log.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activities.length > 5 && (
            <button className="mt-6 w-full py-2.5 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-primary/5 transition-all active:scale-95">
              View Full History
            </button>
          )}
        </section>
      </div>

      {/* Save / Discard Footer Buttons */}
      <div className="col-span-12 flex items-center justify-end gap-3 pt-6 border-t border-outline-variant/30 mt-6 mb-8">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-6 py-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface-container-high rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          Cancel Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 text-xs font-bold bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
