import React from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';

export default function TimeTrackingPage(){
  const [search,setSearch]=React.useState('');const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listTime({});const term=search.toLowerCase();const items=(r.data||[]).filter(x=>!term||x.employee?.name?.toLowerCase().includes(term)||x.job?.number?.toLowerCase().includes(term)||x.task?.title?.toLowerCase().includes(term));setState({loading:false,error:'',items,total:items.length})}catch(e){setState({loading:false,error:e.message||'Unable to load time entries',items:[],total:0})}},[search]);
  React.useEffect(()=>{load()},[load]);
  return <div><div className="page-head"><div><p className="eyebrow">TEAM & LABOUR</p><h1>Time Tracking</h1><p>Record production hours against employees, projects, jobs and tasks for labour costing.</p></div><button className="primary"><Plus size={16}/> Log Time</button></div><section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee or job…"/></label><button className="icon-button" onClick={load} aria-label="Refresh time entries"><RefreshCw size={16}/></button><span className="table-count">{state.total} entries</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'workDate',label:'Date',render:r=>new Date(r.workDate).toLocaleDateString()},{key:'employee',label:'Employee',render:r=>r.employee?.name||'—'},{key:'job',label:'Job',render:r=>r.job?.number||'—'},{key:'task',label:'Task',render:r=>r.task?.title||'—'},{key:'hours',label:'Hours',render:r=>r.hours},{key:'billable',label:'Billable',render:r=>r.billable?'Yes':'No'},{key:'notes',label:'Notes',render:r=>r.notes||'—'}]} /></section></div>;
}
