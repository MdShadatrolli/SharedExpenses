import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import Expenses from './pages/Expenses';
import AddExpense from './pages/AddExpense';
import Settlements from './pages/Settlements';
import ImportCSV from './pages/ImportCSV';
import ImportReport from './pages/ImportReport';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import api from './api';

function SidebarAndContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post('/notifications/read', { notificationId: id });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read', {});
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const loadUser = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed.darkAppearance) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('auth-change', loadUser);
    return () => window.removeEventListener('auth-change', loadUser);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/groups', label: 'Groups', icon: 'group' },
    { path: '/expenses', label: 'Expenses', icon: 'receipt_long' },
    { path: '/settlements', label: 'Settlements', icon: 'handshake' },
    { path: '/import-csv', label: 'CSV Import', icon: 'upload_file' },
    { path: '/import-report', label: 'Reports', icon: 'assessment' },
    { path: '/profile', label: 'Profile', icon: 'account_circle' },
  ];

  if (user && user.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: 'admin_panel_settings' });
  }

  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    if (location.pathname.startsWith('/groups/')) return 'Group Details';
    const match = navItems.find(item => item.path === location.pathname);
    return match ? match.label : 'SplitFlow';
  };

  const SidebarContent = () => (
    <>
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-6 px-2 py-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
          <span className="material-symbols-outlined !text-[24px]">payments</span>
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-primary tracking-tight leading-none">SplitFlow</h1>
          <p className="text-[10px] text-on-surface-variant/75 font-semibold mt-0.5">Fintech Solutions</p>
        </div>
      </div>

      {/* Menu Links */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 duration-150 ${
              isActive(item.path)
                ? 'bg-primary/10 text-primary font-extrabold border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-primary/5'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-outline-variant/30">
        <Link
          to="/add-expense"
          className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Expense</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-error hover:bg-error/5 transition-all active:scale-95 duration-150 w-full text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#fcf8ff] text-[#1b1b24]">
      {/* Noise overlay */}
      <div className="noise-overlay"></div>

      {/* ── DESKTOP Sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[240px] z-50 bg-[#f0ecf9] shadow-md flex-col p-4 gap-4">
        <SidebarContent />
      </aside>

      {/* ── MOBILE Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-[260px] z-50 bg-[#f0ecf9] shadow-2xl flex flex-col p-4 gap-4 transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button inside mobile sidebar */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="md:ml-[240px] flex-1 min-h-screen flex flex-col relative z-10">
        {/* Sticky Header */}
        <header className="w-full sticky top-0 z-40 bg-[#fcf8ff]/70 backdrop-blur-md flex items-center justify-between px-4 md:px-8 py-3 shadow-sm border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <h2 className="text-base md:text-xl font-extrabold text-on-surface tracking-tight">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Search (hidden on small screens) */}
            <div className="relative hidden sm:block">
              <input
                className="bg-surface-container-low border-none rounded-full pl-4 pr-10 py-1.5 text-xs font-medium w-40 md:w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Search transactions..."
                type="text"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full hover:bg-primary/5 transition-colors flex items-center justify-center text-on-surface-variant relative cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white font-extrabold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-[#1b1b24] rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 scale-in max-h-[400px] flex flex-col glass-card text-xs">
                  <div className="px-4 py-3 bg-[#f0ecf9]/50 dark:bg-surface-container border-b border-outline-variant/20 flex items-center justify-between">
                    <span className="font-extrabold text-on-surface">Recent Alerts</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[9px] text-primary hover:underline font-bold uppercase cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10 custom-scrollbar max-h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl mb-1 text-outline/35">notifications_off</span>
                        <p className="font-semibold">No alerts at the moment</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            setShowNotifications(false);
                          }}
                          className={`p-3 text-left hover:bg-primary/5 transition-colors cursor-pointer flex gap-3 items-start ${
                            !notif.read ? 'bg-primary/5 dark:bg-primary/10' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                            notif.type === 'group'
                              ? 'bg-primary/10 text-primary'
                              : notif.type === 'settlement'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-error-container text-on-error-container'
                          }`}>
                            <span className="material-symbols-outlined text-[16px]">
                              {notif.type === 'group' ? 'group_add' : notif.type === 'settlement' ? 'payments' : 'receipt'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start gap-1">
                              <p className={`text-[11px] font-bold text-on-surface ${!notif.read ? 'text-primary' : ''}`}>
                                {notif.title}
                              </p>
                              {!notif.read && <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1"></span>}
                            </div>
                            <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 leading-tight">
                              {notif.message}
                            </p>
                            <p className="text-[8px] text-outline font-semibold mt-1">
                              {new Date(notif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.avatar || 'VK'
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/settlements" element={<Settlements />} />
            <Route path="/import-csv" element={<ImportCSV />} />
            <Route path="/import-report" element={<ImportReport />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const checkToken = () => {
    setToken(localStorage.getItem('token'));
  };

  useEffect(() => {
    window.addEventListener('auth-change', checkToken);
    return () => window.removeEventListener('auth-change', checkToken);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={!token ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password" element={!token ? <ResetPassword /> : <Navigate to="/dashboard" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SidebarAndContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
