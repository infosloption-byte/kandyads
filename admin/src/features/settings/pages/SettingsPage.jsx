import React from 'react';
import { api } from '../../../api';
import './settings.css';

const emptyUser={name:'',email:'',password:'',roleId:'',status:'ACTIVE'};

export default function SettingsPage(){
  const [tab,setTab]=React.useState('users');
  const [users,setUsers]=React.useState([]);
  const [roles,setRoles]=React.useState([]);
  const [permissions,setPermissions]=React.useState([]);
  const [form,setForm]=React.useState(emptyUser);
  const [roleName,setRoleName]=React.useState('');
  const [roleId,setRoleId]=React.useState('');
  const [rolePermissionIds,setRolePermissionIds]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [saving,setSaving]=React.useState(false);
  const [message,setMessage]=React.useState('');
  const [error,setError]=React.useState('');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const [u,r,p]=await Promise.all([api.listSettingsUsers(),api.listSettingsRoles(),api.listSettingsPermissions()]);
      setUsers(u.data||[]);setRoles(r.data||[]);setPermissions(p.data||[]);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  },[]);
  React.useEffect(()=>{load()},[load]);

  React.useEffect(()=>{
    const role=roles.find(r=>String(r.id)===String(roleId));
    setRolePermissionIds(role?.permissions?.map(x=>x.permissionId ?? x.permission?.id) ?? []);
  },[roleId,roles]);

  const submitUser=async(e)=>{e.preventDefault();setSaving(true);setError('');setMessage('');try{await api.createSettingsUser({...form,roleId:Number(form.roleId)});setForm(emptyUser);setMessage('User created successfully.');await load()}catch(err){setError(err.message)}finally{setSaving(false)}};
  const toggleStatus=async(user)=>{setSaving(true);setError('');try{await api.updateSettingsUser(user.id,{status:user.status==='ACTIVE'?'INACTIVE':'ACTIVE'});await load();setMessage('User status updated.')}catch(err){setError(err.message)}finally{setSaving(false)}};
  const createRole=async(e)=>{e.preventDefault();if(!roleName.trim())return;setSaving(true);setError('');try{const r=await api.createSettingsRole({name:roleName.trim()});setRoleName('');await load();setRoleId(String(r.data.id));setMessage('Role created successfully.')}catch(err){setError(err.message)}finally{setSaving(false)}};
  const savePermissions=async()=>{if(!roleId)return;setSaving(true);setError('');try{await api.updateSettingsRolePermissions(Number(roleId),{permissionIds:rolePermissionIds});await load();setMessage('Role permissions updated.')}catch(err){setError(err.message)}finally{setSaving(false)}};

  return <div className="settings-page">
    <div className="page-head"><div><p className="eyebrow">ADMINISTRATION</p><h1>Users & Roles</h1><p>Manage system users, roles and access permissions.</p></div></div>
    {message&&<div className="settings-notice success">{message}</div>}
    {error&&<div className="settings-notice error">{error}</div>}
    <div className="settings-tabs"><button className={tab==='users'?'active':''} onClick={()=>setTab('users')}>Users</button><button className={tab==='roles'?'active':''} onClick={()=>setTab('roles')}>Roles & Permissions</button></div>

    {tab==='users'&&<div className="settings-grid">
      <section className="panel"><div className="panel-head"><div><h2>System users</h2><span>{users.length} users</span></div></div>{loading?<p>Loading…</p>:<div className="settings-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td><strong>{user.name}</strong>{user.employee&&<small>{user.employee.code} · {user.employee.department||'Employee'}</small>}</td><td>{user.email}</td><td>{user.role?.name}</td><td><span className={`status-pill ${user.status.toLowerCase()}`}>{user.status}</span></td><td><button className="text-button" onClick={()=>toggleStatus(user)} disabled={saving}>{user.status==='ACTIVE'?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div>}</section>
      <section className="panel"><div className="panel-head"><div><h2>Create user</h2><span>Assign a role at creation.</span></div></div><form className="settings-form" onSubmit={submitUser}><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></label><label>Password<input type="password" minLength="8" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label><label>Role<select value={form.roleId} onChange={e=>setForm({...form,roleId:e.target.value})} required><option value="">Select role</option>{roles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><button className="primary" disabled={saving}>{saving?'Saving…':'Create User'}</button></form></section>
    </div>}

    {tab==='roles'&&<div className="settings-grid roles-grid">
      <section className="panel"><div className="panel-head"><div><h2>Roles</h2><span>Reusable access profiles.</span></div></div><div className="role-list">{roles.map(r=><button key={r.id} className={String(r.id)===String(roleId)?'selected':''} onClick={()=>setRoleId(String(r.id))}><b>{r.name}</b><small>{r._count?.users||0} users · {r.permissions?.length||0} permissions</small></button>)}</div><form className="inline-form" onSubmit={createRole}><input placeholder="New role name" value={roleName} onChange={e=>setRoleName(e.target.value)}/><button className="primary" disabled={saving}>Add</button></form></section>
      <section className="panel"><div className="panel-head"><div><h2>Permissions</h2><span>{roleId?'Select what this role can access.':'Select a role first.'}</span></div>{roleId&&<button className="primary" onClick={savePermissions} disabled={saving}>{saving?'Saving…':'Save Permissions'}</button>}</div>{roleId?<div className="permission-grid">{permissions.map(p=><label key={p.id}><input type="checkbox" checked={rolePermissionIds.includes(p.id)} onChange={e=>setRolePermissionIds(ids=>e.target.checked?[...ids,p.id]:ids.filter(id=>id!==p.id))}/><span><b>{p.key}</b><small>{p.description||'No description'}</small></span></label>)}</div>:<div className="settings-empty">Choose a role from the left.</div>}</section>
    </div>}
  </div>;
}
