import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, ClipboardList, DollarSign, FileText, FolderKanban, HardHat, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Truck, Users, Wrench, Building2 } from 'lucide-react';
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

function Shell({ user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const navigation = React.useMemo(() => filterNavigation(navigationGroups, user?.permissions || []), [user?.permissions]);
  return <div className="admin-shell"><aside className={open ? 'open' : ''}><div className="brand"><div className="mark">KA</div><div><strong>KANDY<span>ADS</span></strong><small>OPERATIONS</small></div></div><div className="nav-groups">{navigation.map(g => <div key={g.label}><p>{g.label}</p>{g.items.map(([label, path]) => { const Icon = iconMap[label] || ClipboardList; return <NavLink end={path === '/'} key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setOpen(false)}><Icon size={17} />{label}</NavLink>; })}</div>)}</div><div className="sidebar-foot">v0.4 · Operations Platform</div></aside><main className="admin-main"><header><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu /></button><div className="crumb">Kandy Ads / {loc.pathname === '/' ? 'Dashboard' : loc.pathname.slice(1).replaceAll('-', ' ')}</div><button className="user-chip user-button" onClick={() => { onLogout(); navigate('/login'); }}><span>{(user?.name || 'AD').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</span><div><b>{user?.name || 'Admin'}</b><small>{user?.role || 'Administrator'} · Sign out</small></div><LogOut size={15} /></button></header><div className="page-wrap"><AdminRouter user={user} /></div></main></div>;
}

export default function App() { const [user, setUser] = React.useState(null); const [checking, setChecking] = React.useState(Boolean(getToken())); React.useEffect(() => { if (!getToken()) { setChecking(false); return; } api.me().then(r => setUser(r.data)).catch(() => clearToken()).finally(() => setChecking(false)); }, []); if (checking) return <main className="auth-page"><div className="auth-card"><p className="eyebrow">KANDY ADS OPERATIONS</p><h1>Checking session…</h1></div></main>; if (!user) return <LoginPage onLogin={setUser} />; return <Shell user={user} onLogout={() => { api.logout(); setUser(null); }} />; }
