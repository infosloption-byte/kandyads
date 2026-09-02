import React from 'react';
import { api } from '../../../api';
import './settings.css';

export default function WorkflowConfigurationPage(){
  const [configs,setConfigs]=React.useState([]);
  const [entity,setEntity]=React.useState('QUOTE');
  const [rows,setRows]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [saving,setSaving]=React.useState(false);
  const [message,setMessage]=React.useState('');
  const [error,setError]=React.useState('');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{const result=await api.getWorkflowConfigurations();setConfigs(result.data||[]);}catch(e){setError(e.message)}finally{setLoading(false)}
  },[]);
  React.useEffect(()=>{load()},[load]);
  React.useEffect(()=>{
    const current=configs.find(item=>item.entity===entity);
    setRows((current?.transitions||[]).filter(item=>item.active).map(item=>({fromStatus:item.fromStatus,toStatus:item.toStatus})));
  },[configs,entity]);

  const statuses=configs.find(item=>item.entity===entity)?.statuses||[];
  const addRow=()=>setRows([...rows,{fromStatus:statuses[0]||'',toStatus:statuses[1]||''}]);
  const removeRow=index=>setRows(rows.filter((_,i)=>i!==index));
  const updateRow=(index,field,value)=>setRows(rows.map((row,i)=>i===index?{...row,[field]:value}:row));
  const save=async()=>{
    setSaving(true);setMessage('');setError('');
    try{await api.updateWorkflowConfiguration(entity,{transitions:rows.map(row=>({...row,active:true}))});setMessage(`${entity} workflow saved successfully.`);await load();}
    catch(e){setError(e.message)}finally{setSaving(false)}
  };

  return <div className="settings-page">
    <div className="page-head"><div><p className="eyebrow">WORKFLOW</p><h1>Status & workflow configuration</h1><p>Control which status transitions are available for each operational workflow.</p></div></div>
    {message&&<div className="settings-notice success">{message}</div>}{error&&<div className="settings-notice error">{error}</div>}
    <div className="settings-tabs">{configs.map(item=><button key={item.entity} className={entity===item.entity?'active':''} onClick={()=>setEntity(item.entity)}>{item.entity}</button>)}</div>
    {loading?<p>Loading…</p>:<div className="settings-grid">
      <section className="panel"><div className="panel-head"><div><h2>{entity} transitions</h2><span>{rows.length} enabled transitions</span></div><button className="primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Workflow'}</button></div>
        <div className="settings-table-wrap"><table><thead><tr><th>From status</th><th>To status</th><th></th></tr></thead><tbody>{rows.length===0?<tr><td colSpan="3">No transitions configured. Same-status saves are still allowed; business-specific completion guards remain enforced.</td></tr>:rows.map((row,index)=><tr key={`${row.fromStatus}-${row.toStatus}-${index}`}><td><select value={row.fromStatus} onChange={e=>updateRow(index,'fromStatus',e.target.value)}>{statuses.map(status=><option key={status}>{status}</option>)}</select></td><td><select value={row.toStatus} onChange={e=>updateRow(index,'toStatus',e.target.value)}>{statuses.map(status=><option key={status}>{status}</option>)}</select></td><td><button className="text-button" onClick={()=>removeRow(index)}>Remove</button></td></tr>)}</tbody></table></div>
        <div style={{marginTop:16}}><button className="text-button" onClick={addRow}>+ Add transition</button></div>
      </section>
    </div>}
  </div>;
}
