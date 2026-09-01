import React from 'react';
import { Plus, RefreshCw, Search, ArrowRight } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import LeadForm from '../components/LeadForm';

const statuses=['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'];

export default function LeadsPage(){
  const [search,setSearch]=React.useState('');
  const [status,setStatus]=React.useState('');
  const [open,setOpen]=React.useState(false);
  const [saving,setSaving]=React.useState(false);
  const [employees,setEmployees]=React.useState([]);
  const [clients,setClients]=React.useState([]);
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const [r,e,c]=await Promise.all([api.listLeads({search:search||undefined,status:status||undefined}),api.listEmployees(),api.listClients()]);setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0});setEmployees(e.data||[]);setClients(c.data||[]);}catch(err){setState({loading:false,error:err.message||'Unable to load leads',items:[],total:0})}},[search,status]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  async function createLead(input){setSaving(true);try{await api.createLead(input);setOpen(false);await load();}finally{setSaving(false)}}
  async function convertLead(lead){try{const result=await api.convertLead(lead.id,{clientId:lead.clientId||undefined});await load();window.alert(`Lead converted to ${result.data.enquiry.number}`);}catch(e){window.alert(e.message||'Unable to convert lead.')}}
  const columns=[
    {key:'name',label:'Lead',render:r=><><strong>{r.name}</strong><small>{r.company||r.email||'—'}</small></>},
    {key:'source',label:'Source'},
    {key:'assignedTo',label:'Owner',render:r=>r.assignedTo?.name||'Unassigned'},
    {key:'estimatedValue',label:'Value',render:r=>r.estimatedValue==null?'—':`LKR ${Number(r.estimatedValue).toLocaleString()}`},
    {key:'status',label:'Status',render:r=><span className="table-status">{r.status}</span>},
    {key:'followUpAt',label:'Follow-up',render:r=>r.followUpAt?new Date(r.followUpAt).toLocaleDateString():'—'},
    {key:'actions',label:'',render:r=>r.status!=='WON'&&r.status!=='LOST'?<button className="secondary" onClick={()=>convertLead(r)}><ArrowRight size={14}/> Convert</button>:null},
  ];
  return <div>
    <div className="page-head"><div><p className="eyebrow">SALES & CRM</p><h1>Leads</h1><p>Track prospects, follow-ups and the path from first contact to enquiry.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New Lead</button></div>
    <section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…" /></label><select className="toolbar-select" value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select><button className="icon-button" onClick={load} aria-label="Refresh leads"><RefreshCw size={16}/></button><span className="table-count">{state.total} leads</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={columns} empty="No leads match your filters." /></section>
    <Modal open={open} title="New lead" description="Capture a prospect before turning it into a client enquiry." onClose={()=>setOpen(false)} width="760px"><LeadForm employees={employees} clients={clients} onSubmit={createLead} onCancel={()=>setOpen(false)} submitting={saving}/></Modal>
  </div>;
}
