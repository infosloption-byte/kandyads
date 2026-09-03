import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BarChart3, BriefcaseBusiness, ClipboardList, DollarSign, FileText, FolderKanban, HardHat, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Truck, Users, Wrench, Building2 } from 'lucide-react';
import { api, clearToken, getToken } from './api';
import LoginPage from './features/auth/pages/LoginPage';
import AdminRouter from './app/router';
import { navigationGroups, filterNavigation } from './config/navigation';

const iconMap = {
  Dashboard: LayoutDashboard, Leads: Users, Clients: Users, Enquiries: ClipboardList, Quotes: FileText,
  Projects: FolderKanban, Jobs: BriefcaseBusiness, Tasks: ClipboardList, Materials: Package, Inventory: Package,
  Purchasing: ShoppingCart, Vendors: Building2, Outsourcing: Truck, Installations: HardHat, Employees: Users,
  'Time Tracking': Wrench, Expenses: DollarSign, Invoices: FileText, Profitability: BarChart3, Reports: BarChart3, Settings,
};

function NotificationCenter() {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const load = React.useCallback(async () => {
    try { const result = await api.listNotifications({ limit: 20 }); setItems(result.data || []); setUnread(Number(result.meta?.unreadCount || 0)); } catch { /* shell remains usable when notifications are unavailable */ }
  }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const timer = setInterval(load, 60000); return () => clearInterval(timer); }, [load]);
  const markRead = async id => { setLoading(true); try { await api.markNotificationRead(id); await load(); } finally { setLoading(false); } };
  const markAll = async () => { setLoading(true); try { await api.markAllNotificationsRead(); await load(); } finally { setLoading(false); } };
  const generate = async () => { setLoading(true); try { await api.generateNotifications(); await load(); } finally { setLoading(false); } };
  return <div className="notification-center">
    <button className="icon-button notification-trigger" onClick={() => setOpen(v => !v)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}>
      <Bell size={18} />{unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <div className="notification-popover" role="dialog" aria-label="Notification center">
      <div className="notification-head"><div><b>Notifications</b><small>{unread} unread</small></div><div className="notification-actions"><button onClick={generate} disabled={loading}>Refresh</button><button onClick={markAll} disabled={loading || unread === 0}>Mark all read</button></div></div>
      <div className="notification-list">{items.length === 0 ? <div className="notification-empty">No notifications yet.</div> : items.map(item => <button key={item.id} className={`notification-item${item.readAt ? '' : ' unread'}`} onClick={() => !item.readAt && markRead(item.id)} disabled={loading}>
        <span className="notification-dot" aria-hidden="true" />
        <span><strong>{item.title}</strong><small>{item.message}</small><em>{new Date(item.createdAt).toLocaleString()}</em></span>
      </button>)}</div>
    </div>}
  </div>;
}

function Shell({ user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const navigation = React.useMemo(() => filterNavigation(navigationGroups, user?.permissions || []), [user?.permissions]);
  return <div className="admin-shell"><aside className={open ? 'open' : ''}><div className="brand"><div className="mark">KA</div><div><strong>KANDY<span>ADS</span></strong><small>OPERATIONS</small></div></div><div className="nav-groups">{navigation.map(g => <div key={g.label}><p>{g.label}</p>{g.items.map(([label, path]) => { const Icon = iconMap[label] || ClipboardList; return <NavLink end={path === '/'} key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setOpen(false)}><Icon size={17} />{label}</NavLink>; })}</div>)}</div><div className="sidebar-foot">v0.4 · Operations Platform</div></aside><main className="admin-main"><header><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button><div className="crumb">Kandy Ads / {loc.pathname === '/' ? 'Dashboard' : loc.pathname.slice(1).replaceAll('-', ' ')}</div><div className="header-actions"><NotificationCenter /><button className="user-chip user-button" onClick={() => { onLogout(); navigate('/login'); }}><span>{(user?.name || 'AD').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</span><div><b>{user?.name || 'Admin'}</b><small>{user?.role || 'Administrator'} · Sign out</small></div><LogOut size={15} /></button></div></header><div className="page-wrap"><AdminRouter user={user} /></div></main></div>;
}

export default function App() { const [user, setUser] = React.useState(null); const [checking, setChecking] = React.useState(Boolean(getToken())); React.useEffect(() => { if (!getToken()) { setChecking(false); return; } api.me().then(r => setUser(r.data)).catch(() => clearToken()).finally(() => setChecking(false)); }, []); if (checking) return <main className="auth-page"><div className="auth-card"><p className="eyebrow">KANDY ADS OPERATIONS</p><h1>Checking session…</h1></div></main>; if (!user) return <LoginPage onLogin={setUser} />; return <Shell user={user} onLogout={() => { api.logout(); setUser(null); }} />; }
