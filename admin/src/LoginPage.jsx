import React from 'react';
import { ArrowUpRight, LockKeyhole, Mail } from 'lucide-react';
import { api } from './api';

export default function LoginPage({ onLogin }) {
  const [email,setEmail]=React.useState('admin@kandyads.lk');
  const [password,setPassword]=React.useState('ChangeMe!123');
  const [error,setError]=React.useState('');
  const [loading,setLoading]=React.useState(false);

  async function submit(event){
    event.preventDefault(); setError(''); setLoading(true);
    try { const user=await api.login({email,password}); onLogin(user); }
    catch(err){ setError(err.message || 'Unable to sign in'); }
    finally { setLoading(false); }
  }

  return <main className="auth-page"><div className="auth-card">
    <div className="auth-brand"><div className="mark">KA</div><div><strong>KANDY<span>ADS</span></strong><small>OPERATIONS</small></div></div>
    <p className="eyebrow">SECURE ACCESS</p>
    <h1>Sign in to operations.</h1>
    <p className="auth-copy">Manage enquiries, projects, production, inventory and finance from one place.</p>
    <form onSubmit={submit}>
      <label>Email <span><Mail size={15}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></span></label>
      <label>Password <span><LockKeyhole size={15}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></span></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary auth-submit" disabled={loading}>{loading?'Signing in…':'Sign in'} <ArrowUpRight size={17}/></button>
    </form>
    <small className="auth-hint">Initial development account is seeded by the backend. Change the password before production use.</small>
  </div></main>;
}
