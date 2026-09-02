import React from 'react';
import { api } from '../../../api';
import './settings.css';

const emptyBranch={code:'',name:'',address:'',phone:'',email:'',active:true};
const emptySequence={entity:'',prefix:'',nextValue:1,padding:4,active:true};

export default function SettingsMasterDataPage(){
  const [tab,setTab]=React.useState('branches');
  const [branches,setBranches]=React.useState([]);
  const [sequences,setSequences]=React.useState([]);
  const [branch,setBranch]=React.useState(emptyBranch);
  const [sequence,setSequence]=React.useState(emptySequence);
  const [editingBranch,setEditingBranch]=React.useState(null);
  const [editingSequence,setEditingSequence]=React.useState(null);
  const [loading,setLoading]=React.useState(true);
  const [saving,setSaving]=React.useState(false);
  const [message,setMessage]=React.useState('');
  const [error,setError]=React.useState('');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{const [b,s]=await Promise.all([api.listSettingsBranches(),api.listNumberSequences()]);setBranches(b.data||[]);setSequences(s.data||[]);}catch(e){setError(e.message)}finally{setLoading(false)}
  },[]);
  React.useEffect(()=>{load()},[load]);

  const saveBranch=async e=>{e.preventDefault();setSaving(true);setError('');try{if(editingBranch){await api.updateSettingsBranch(editingBranch,{...branch,active:Boolean(branch.active)});setMessage('Branch updated successfully.')}else{await api.createSettingsBranch({...branch,active:Boolean(branch.active)});setMessage('Branch created successfully.')}setEditingBranch(null);setBranch(emptyBranch);await load();}catch(err){setError(err.message)}finally{setSaving(false)}};
  const saveSequence=async e=>{e.preventDefault();setSaving(true);setError('');try{if(editingSequence){await api.updateNumberSequence(editingSequence,{prefix:sequence.prefix,nextValue:Number(sequence.nextValue),padding:Number(sequence.padding),active:Boolean(sequence.active)});setMessage('Number sequence updated successfully.')}else{await api.createNumberSequence({...sequence,nextValue:Number(sequence.nextValue),padding:Number(sequence.padding),active:Boolean(sequence.active)});setMessage('Number sequence created successfully.')}setEditingSequence(null);setSequence(emptySequence);await load();}catch(err){setError(err.message)}finally{setSaving(false)}};
  const generate=async id=>{setSaving(true);setError('');try{const result=await api.nextNumberSequence(id);setMessage(`Generated ${result.data.number}.`);await load()}catch(err){setError(err.message)}finally{setSaving(false)}};

  return <div className="settings-page">
    <div className="page-head"><div><p className="eyebrow">MASTER DATA</p><h1>Locations & Numbering</h1><p>Maintain operating locations and document-number sequences.</p></div></div>
    {message&&<div className="settings-notice success">{message}</div>}{error&&<div className="settings-notice error">{error}</div>}
    <div className="settings-tabs"><button className={tab==='branches'?'active':''} onClick={()=>setTab('branches')}>Branches</button><button className={tab==='sequences'?'active':''} onClick={()=>setTab('sequences')}>Number Sequences</button></div>
    {tab==='branches'&&<div className="settings-grid">
      <section className="panel"><div className="panel-head"><div><h2>Operating locations</h2><span>{branches.length} branches</span></div></div>{loading?<p>Loading…</p>:<div className="settings-table-wrap"><table><thead><tr><th>Code</th><th>Name</th><th>Contact</th><th>Status</th><th></th></tr></thead><tbody>{branches.map(item=><tr key={item.id}><td><strong>{item.code}</strong></td><td>{item.name}<small>{item.address||'No address'}</small></td><td>{item.phone||item.email||'—'}</td><td><span className={`status-pill ${item.active?'active':'inactive'}`}>{item.active?'ACTIVE':'INACTIVE'}</span></td><td><button className="text-button" onClick={()=>{setEditingBranch(item.id);setBranch({code:item.code,name:item.name,address:item.address||'',phone:item.phone||'',email:item.email||'',active:Boolean(item.active)})}}>Edit</button></td></tr>)}</tbody></table></div>}</section>
      <section className="panel"><div className="panel-head"><div><h2>{editingBranch?'Edit branch':'Add branch'}</h2><span>Use a stable code for operational reporting.</span></div></div><form className="settings-form" onSubmit={saveBranch}><div className="form-grid"><label>Code<input value={branch.code} onChange={e=>setBranch({...branch,code:e.target.value})} required disabled={Boolean(editingBranch)}/></label><label>Name<input value={branch.name} onChange={e=>setBranch({...branch,name:e.target.value})} required/></label><label>Phone<input value={branch.phone||''} onChange={e=>setBranch({...branch,phone:e.target.value})}/></label><label>Email<input type="email" value={branch.email||''} onChange={e=>setBranch({...branch,email:e.target.value})}/></label></div><label>Address<textarea rows="4" value={branch.address||''} onChange={e=>setBranch({...branch,address:e.target.value})}/></label><label><input type="checkbox" checked={Boolean(branch.active)} onChange={e=>setBranch({...branch,active:e.target.checked})}/> Active</label><div><button className="primary" disabled={saving}>{saving?'Saving…':editingBranch?'Save Branch':'Create Branch'}</button>{editingBranch&&<button type="button" className="text-button" onClick={()=>{setEditingBranch(null);setBranch(emptyBranch)}}>Cancel</button>}</div></form></section>
    </div>}
    {tab==='sequences'&&<div className="settings-grid">
      <section className="panel"><div className="panel-head"><div><h2>Document sequences</h2><span>Next numbers are allocated transactionally.</span></div></div>{loading?<p>Loading…</p>:<div className="settings-table-wrap"><table><thead><tr><th>Entity</th><th>Format</th><th>Next</th><th>Status</th><th></th></tr></thead><tbody>{sequences.map(item=><tr key={item.id}><td><strong>{item.entity}</strong></td><td>{item.prefix}{String(item.nextValue).padStart(Number(item.padding),'0')}</td><td>{item.nextValue}</td><td><span className={`status-pill ${item.active?'active':'inactive'}`}>{item.active?'ACTIVE':'INACTIVE'}</span></td><td><button className="text-button" disabled={saving||!item.active} onClick={()=>generate(item.id)}>Generate next</button>{' '}<button className="text-button" onClick={()=>{setEditingSequence(item.id);setSequence({entity:item.entity,prefix:item.prefix,nextValue:item.nextValue,padding:item.padding,active:Boolean(item.active)})}}>Edit</button></td></tr>)}</tbody></table></div>}</section>
      <section className="panel"><div className="panel-head"><div><h2>{editingSequence?'Edit sequence':'Add sequence'}</h2><span>Entity keys must remain unique.</span></div></div><form className="settings-form" onSubmit={saveSequence}><div className="form-grid"><label>Entity<input value={sequence.entity} onChange={e=>setSequence({...sequence,entity:e.target.value})} required disabled={Boolean(editingSequence)}/></label><label>Prefix<input value={sequence.prefix} onChange={e=>setSequence({...sequence,prefix:e.target.value})} required/></label><label>Next value<input type="number" min="1" value={sequence.nextValue} onChange={e=>setSequence({...sequence,nextValue:e.target.value})} required/></label><label>Padding<input type="number" min="1" max="12" value={sequence.padding} onChange={e=>setSequence({...sequence,padding:e.target.value})} required/></label></div><label><input type="checkbox" checked={Boolean(sequence.active)} onChange={e=>setSequence({...sequence,active:e.target.checked})}/> Active</label><div><button className="primary" disabled={saving}>{saving?'Saving…':editingSequence?'Save Sequence':'Create Sequence'}</button>{editingSequence&&<button type="button" className="text-button" onClick={()=>{setEditingSequence(null);setSequence(emptySequence)}}>Cancel</button>}</div></form></section>
    </div>}
  </div>;
}
