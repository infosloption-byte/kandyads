import React from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function ClientsPage(){
  const [search,setSearch]=React.useState('');
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});

  const load=React.useCallback(async()=>{
    setState(s=>({...s,loading:true,error:''}));
    try{
      const result=await api.listClients({search:search||undefined});
      setState({loading:false,error:'',items:result.data||[],total:result.meta?.total||0});
    }catch(error){
      setState({loading:false,error:error.message||'Unable to load clients',items:[],total:0});
    }
  },[search]);

  React.useEffect(()=>{ const timer=setTimeout(load,250); return()=>clearTimeout(timer); },[load]);

  return <div>
    <div className="page-head">
      <div><p className="eyebrow">CRM</p><h1>Clients</h1><p>Companies and customer relationships used across enquiries, projects, jobs and finance.</p></div>
      <button className="primary"><Plus size={16}/> New Client</button>
    </div>
    <section className="panel table-panel">
      <div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…"/></label><button className="icon-button" onClick={load} aria-label="Refresh clients"><RefreshCw size={16}/></button><span className="table-count">{state.total} clients</span></div>
      {state.loading && <div className="table-state">Loading clients…</div>}
      {!state.loading && state.error && <div className="table-state error-state">{state.error}</div>}
      {!state.loading && !state.error && state.items.length===0 && <div className="table-state">No clients found.</div>}
      {!state.loading && !state.error && state.items.length>0 && <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Code</th><th>Company</th><th>Contact</th><th>Phone</th><th>Email</th><th>Status</th></tr></thead><tbody>{state.items.map(client=><tr key={client.id}><td>{client.code}</td><td><strong>{client.companyName}</strong><small>{client.industry||'—'}</small></td><td>{client.contactName||'—'}</td><td>{client.phone||'—'}</td><td>{client.email||'—'}</td><td><span className="table-status">{client.active?'Active':'Inactive'}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
