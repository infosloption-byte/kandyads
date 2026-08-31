import React from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';

export default function JobsPage(){
  const [search,setSearch]=React.useState('');
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listJobs({search:search||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0})}catch(e){setState({loading:false,error:e.message||'Unable to load jobs',items:[],total:0})}},[search]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  return <div><div className="page-head"><div><p className="eyebrow">DELIVERY</p><h1>Jobs</h1><p>Production work packages assigned to internal teams or external vendors.</p></div><button className="primary"><Plus size={16}/> New Job</button></div><section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs…"/></label><button className="icon-button" onClick={load} aria-label="Refresh jobs"><RefreshCw size={16}/></button><span className="table-count">{state.total} jobs</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'number',label:'Job',render:r=><><strong>{r.number}</strong><small>{r.title}</small></>},{key:'project',label:'Project',render:r=><><strong>{r.project?.name||'—'}</strong><small>{r.project?.client?.companyName||''}</small></>},{key:'assignmentType',label:'Assignment',render:r=><span className="table-status">{r.assignmentType}</span>},{key:'status',label:'Status',render:r=><span className="table-status">{r.status.replaceAll('_',' ')}</span>},{key:'revenue',label:'Revenue',render:r=>`LKR ${Number(r.revenue||0).toLocaleString()}`},{key:'dueDate',label:'Due',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}]} /></section></div>;
}
