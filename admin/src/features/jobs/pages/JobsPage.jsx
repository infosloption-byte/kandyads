import React from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';
import Modal from '../../../components/common/Modal';
import JobForm from '../components/JobForm';

export default function JobsPage(){
  const [search,setSearch]=React.useState('');
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const [open,setOpen]=React.useState(false);
  const [saving,setSaving]=React.useState(false);
  const [lookups,setLookups]=React.useState({projects:[],services:[],error:''});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listJobs({search:search||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0})}catch(e){setState({loading:false,error:e.message||'Unable to load jobs',items:[],total:0})}},[search]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  React.useEffect(()=>{let active=true;Promise.all([api.listProjects({pageSize:100}),api.listServices({pageSize:100})]).then(([p,s])=>{if(active)setLookups({projects:p.data||[],services:s.data||[],error:''})}).catch(e=>{if(active)setLookups(v=>({...v,error:e.message||'Unable to load job form data'}))});return()=>{active=false}},[]);
  async function createJob(input){setSaving(true);try{await api.createJob(input);setOpen(false);await load()}finally{setSaving(false)}}
  return <div><div className="page-head"><div><p className="eyebrow">DELIVERY</p><h1>Jobs</h1><p>Production work packages assigned to internal teams or external vendors.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New Job</button></div>{lookups.error&&<div className="form-error">{lookups.error}</div>}<section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs…"/></label><button className="icon-button" onClick={load} aria-label="Refresh jobs"><RefreshCw size={16}/></button><span className="table-count">{state.total} jobs</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'number',label:'Job',render:r=><><strong>{r.number}</strong><small>{r.title}</small></>},{key:'project',label:'Project',render:r=><><strong>{r.project?.name||'—'}</strong><small>{r.project?.client?.companyName||''}</small></>},{key:'assignmentType',label:'Assignment',render:r=><span className="table-status">{r.assignmentType}</span>},{key:'status',label:'Status',render:r=><span className="table-status">{r.status.replaceAll('_',' ')}</span>},{key:'revenue',label:'Revenue',render:r=>`LKR ${Number(r.revenue||0).toLocaleString()}`},{key:'dueDate',label:'Due',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}]} /></section><Modal open={open} title="Create job" description="Create a production work package inside a project." onClose={()=>setOpen(false)} width="760px"><JobForm projects={lookups.projects} services={lookups.services} onSubmit={createJob} onCancel={()=>setOpen(false)} submitting={saving}/></Modal></div>;
}
