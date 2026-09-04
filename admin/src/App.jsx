import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, BarChart3, BriefcaseBusiness, ClipboardList, DollarSign, FileText, FolderKanban, HardHat, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Truck, Users, Wrench, Building2, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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

function NotificationCenter({ onToast }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const triggerRef = React.useRef(null);
  const load = React.useCallback(async () => { try { const result = await api.listNotifications({ limit: 20 }); setItems(result.data || []); setUnread(Number(result.meta?.unreadCount || 0)); } catch { /* shell remains usable */ } }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const timer = setInterval(load, 60000); return () => clearInterval(timer); }, [load]);
  React.useEffect(() => { if (!open) return; const onKey = event => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [open]);
  const markRead = async id => { setLoading(true); try { await api.markNotificationRead(id); await load(); onToast('Notification marked as read.'); } catch (error) { onToast(error.message || 'Unable to update notification.','error'); } finally { setLoading(false); } };
  const markAll = async () => { setLoading(true); try { await api.markAllNotificationsRead(); await load(); onToast('All notifications marked as read.'); } catch (error) { onToast(error.message || 'Unable to update notifications.','error'); } finally { setLoading(false); } };
  const generate = async () => { setLoading(true); try { const result=await api.generateNotifications(); await load(); onToast(`${Number(result.data?.created || 0)} new notification${Number(result.data?.created || 0)===1?'':'s'} generated.`); } catch (error) { onToast(error.message || 'Unable to refresh notifications.','error'); } finally { setLoading(false); } };
  return <div className="notification-center">
    <button ref={triggerRef} className="icon-button notification-trigger" onClick={() => setOpen(v => !v)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-controls="notification-popover"><Bell size={18} />{unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}</button>
    {open && <div id="notification-popover" className="notification-popover" role="dialog" aria-label="Notification center">
      <div className="notification-head"><div><b>Notifications</b><small>{unread} unread</small></div><div className="notification-actions"><button onClick={generate} disabled={loading}>Refresh</button><button onClick={markAll} disabled={loading || unread === 0}>Mark all read</button><button className="notification-close" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label="Close notifications"><X size={14}/></button></div></div>
      <div className="notification-list" aria-live="polite">{items.length === 0 ? <div className="notification-empty">No notifications yet.</div> : items.map(item => <button key={item.id} className={`notification-item${item.readAt ? '' : ' unread'}`} onClick={() => !item.readAt && markRead(item.id)} disabled={loading} aria-label={`${item.title}${item.readAt ? '' : ', unread'}`}>
        <span className="notification-dot" aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.message}</small><em>{new Date(item.createdAt).toLocaleString()}</em></span>
      </button>)}</div>
    </div>}
  </div>;
}

function Shell({ user, onLogout }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const navigate = useNavigate();
  const navigation = React.useMemo(() => filterNavigation(navigationGroups, user?.permissions || []), [user?.permissions]);
  const showToast = React.useCallback((message,type='success') => { setToast({message,type}); window.clearTimeout(showToast.timer); showToast.timer=window.setTimeout(()=>setToast(null),3200); }, []);
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = event => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  return <div className={`admin-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
    <aside className={`${collapsed ? 'collapsed ' : ''}${mobileOpen ? 'open' : ''}`} aria-label="Primary navigation">
      <div className="brand"><div className="mark">KA</div><div className="brand-copy"><strong>KANDY<span>ADS</span></strong><small>OPERATIONS</small></div></div>
      <div className="nav-groups">{navigation.map(g => <div key={g.label}><p>{g.label}</p>{g.items.map(([label, path]) => { const Icon = iconMap[label] || ClipboardList; return <NavLink end={path === '/'} key={path} to={path} title={collapsed ? label : undefined} className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}><Icon size={17} /><span className="nav-label">{label}</span></NavLink>; })}</div>)}</div>
      <div className="sidebar-foot">v0.4 · Operations Platform</div>
    </aside>
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={closeMobile} />}
    <main className="admin-main">
      <header>
        <button className="sidebar-toggle desktop-sidebar-toggle" onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button>
        <div className="mobile-top-brand"><div className="mobile-top-mark">KA</div><div><strong>KANDY<span>ADS</span></strong><small>OPERATIONS</small></div></div>
        <button className="sidebar-toggle mobile-menu" onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen}>{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        <div className="header-actions"><NotificationCenter onToast={showToast} /><button className="user-chip user-button" onClick={() => { onLogout(); navigate('/login'); }}><span>{(user?.name || 'AD').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</span><div><b>{user?.name || 'Admin'}</b><small>{user?.role || 'Administrator'} · Sign out</small></div><LogOut size={15} /></button></div>
      </header>
      <div className="page-wrap"><AdminRouter user={user} /></div>
      {toast&&<div className={`toast toast-${toast.type}`} role="status" aria-live="polite">{toast.message}</div>}
    </main>
  </div>;
}

export default function App() { const [user, setUser] = React.useState(null); const [checking, setChecking] = React.useState(Boolean(getToken())); React.useEffect(() => { if (!getToken()) { setChecking(false); return; } api.me().then(r => setUser(r.data)).catch(() => clearToken()).finally(() => setChecking(false)); }, []); if (checking) return <main className="auth-page"><div className="auth-card"><p className="eyebrow">KANDY ADS OPERATIONS</p><h1>Checking session…</h1></div></main>; if (!user) return <LoginPage onLogin={setUser} />; return <Shell user={user} onLogout={() => { api.logout(); setUser(null); }} />; }
