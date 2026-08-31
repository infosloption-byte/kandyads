import React from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';

export default function EmployeesPage(){
  const [search,setSearch]=React.useState('');const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listEmployees({search:search||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0})}catch(e){setState({loading:false,error:e.message||'Unable to load employees',items:[],total:0})}},[search]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  return <div><div className="page-head"><div><p className="eyebrow">TEAM & LABOUR</p><h1>Employees</h1><p>Maintain internal staff, roles and costing rates used by production jobs.</p></div><button className="primary"><Plus size={16}/> New Employee</button></div><section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees…"/></label><button className="icon-button" onClick={load} aria-label="Refresh employees"><RefreshCw size={16}/></button><span className="table-count">{state.total} employees</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'code',label:'Code'},{key:'name',label:'Employee',render:r=><><strong>{r.name}</strong><small>{r.department||'—'}</small></>},{key:'employmentType',label:'Type',render:r=>r.employmentType||'—'},{key:'hourlyCost',label:'Hourly cost',render:r=>`LKR ${Number(r.hourlyCost||0).toLocaleString()}`},{key:'dailyCost',label:'Daily cost',render:r=>r.dailyCost?`LKR ${Number(r.dailyCost).toLocaleString()}`:'—'},{key:'status',label:'Status',render:r=><span className="table-status">{r.status}</span>}]} /></section></div>;
}
