import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Edit3, FileText, Paperclip, Plus, ExternalLink } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import TaskForm from '../components/TaskForm';
import './task-detail.css';

const statuses=['PENDING','READY','IN_PROGRESS','BLOCKED','REVIEW','COMPLETED','CANCELLED'];
const date=v=>v?new Date(v).toLocaleDateString():'—';
export default function TaskDetailPage(){
  const {id}=useParams();
  const [state,setState]=React.useState({loading:true,error:'',data:null});
  const [saving,setSaving]=React.useState(false); const [editing,setEditing]=React.useState(false);
  const [employees,setEmployees]=React.useState([]);
  const [attachmentForm,setAttachmentForm]=React.useState({name:'',url:'',description:''});
  const [addingAttachment,setAddingAttachment]=React.useState(false); const [attachmentError,setAttachmentError]=React.useState('');
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.getTask(id);setState({loading:false,error:'',data:r.data})}catch(e){setState({loading:false,error:e.message||'Unable to load task',data:null})}},[id]);
  React.useEffect(()=>{load();api.listEmployees({pageSize:100}).then(r=>setEmployees(r.data||[])).catch(()=>undefined)},[load]);
  async function changeStatus(status){setSaving(true);try{await api.updateTaskStatus(id,{status});await load()}catch(e){setState(s=>({...s,error:e.message||'Unable to update task'}))}finally{setSaving(false)}}
  async function saveEdit(input){setSaving(true);try{await api.updateTask(id,input);setEditing(false);await load()}catch(e){setState(s=>({...s,error:e.message||'Unable to save task'}))}finally{setSaving(false)}}
  async function addAttachment(e){e.preventDefault();setAttachmentError('');if(!attachmentForm.name.trim()||!attachmentForm.url.trim()){setAttachmentError('Attachment name and URL are required.');return;}setAddingAttachment(true);try{await api.createAttachment({entityType:'TASK',entityId:Number(id),name:attachmentForm.name.trim(),description:attachmentForm.description.trim()||undefined,url:attachmentForm.url.trim()});setAttachmentForm({name:'',url:'',description:''});await load()}catch(e){setAttachmentError(e.message||'Unable to add attachment')}finally{setAddingAttachment(false)}}
  if(state.loading)return <div className="detail-state">Loading task…</div>;
  if(!state.data)return <div className="detail-state error-state">{state.error||'Task not found'}</div>;
  const t=state.data;
  return <div className="task-detail">
    {state.error&&<div className="form-error">{state.error}</div>}
    <Link className="back-link" to="/tasks"><ArrowLeft size={15}/> Back to Tasks</Link>
    <div className="task-hero"><div><p className="eyebrow">TASK</p><h1>{t.title}</h1><p>{t.job?.number||'—'} · {t.job?.project?.name||'—'}</p></div><div className="detail-actions"><button className="secondary" onClick={()=>setEditing(true)} disabled={saving||t.status==='COMPLETED'}><Edit3 size={15}/> Edit</button><select value={t.status} disabled={saving} onChange={e=>changeStatus(e.target.value)} aria-label="Task status">{statuses.map(s=><option key={s}>{s}</option>)}</select></div></div>
    <div className="task-grid">
      <section className="task-card"><h2>Execution</h2><div className="task-line"><span><Clock3 size={15}/> Assigned</span><strong>{t.employee?.name||'Unassigned'}</strong></div><div className="task-line"><span>Planned hours</span><strong>{t.estimatedHours??'—'}</strong></div><div className="task-line"><span>Actual hours</span><strong>{t.actualHours??'—'}</strong></div><div className="task-line"><span>Start date</span><strong>{date(t.startDate)}</strong></div><div className="task-line"><span>Due date</span><strong>{date(t.dueDate)}</strong></div><div className="task-line"><span>Completed</span><strong>{t.completedAt?date(t.completedAt):'Not completed'}</strong></div></section>
      <section className="task-card"><h2>Description</h2><p className="task-description">{t.description||'No task description provided.'}</p><div className="task-completion"><CheckCircle2 size={18}/><div><strong>{t.status==='COMPLETED'?'Task completed':'Production task'}</strong><small>{t.status==='COMPLETED'?'Completed at '+date(t.completedAt):'Update the status as work progresses.'}</small></div></div></section>
      <section className="task-card"><h2><FileText size={18}/> Production notes</h2><p className="task-notes">{t.notes||'No production notes added.'}</p></section>
      <section className="task-card"><h2><Paperclip size={18}/> Attachments</h2>{!t.attachments?.length?<p className="muted">No attachments registered for this task.</p>:<div className="attachment-list">{t.attachments.map(a=><div className="attachment-item" key={a.id}><div><strong>{a.name}</strong><small>{a.description||a.mimeType||'Task attachment'}</small></div>{a.url?<a href={a.url} target="_blank" rel="noreferrer" aria-label={`Open ${a.name}`}><ExternalLink size={15}/></a>:<span className="muted">Stored</span>}</div>)}</div>}
        <form className="attachment-form" onSubmit={addAttachment}><input value={attachmentForm.name} onChange={e=>setAttachmentForm(v=>({...v,name:e.target.value}))} placeholder="Attachment name"/><input value={attachmentForm.url} onChange={e=>setAttachmentForm(v=>({...v,url:e.target.value}))} placeholder="https://…"/><input value={attachmentForm.description} onChange={e=>setAttachmentForm(v=>({...v,description:e.target.value}))} placeholder="Description (optional)"/><button className="secondary" disabled={addingAttachment}><Plus size={15}/>{addingAttachment?'Adding…':'Add attachment'}</button></form>{attachmentError&&<div className="form-error">{attachmentError}</div>}</section>
    </div>
    <Modal open={editing} title="Edit task" description="Update task assignment, schedule, status and production notes." onClose={()=>setEditing(false)} width="720px"><TaskForm editMode initialValues={t} employees={employees} onSubmit={saveEdit} onCancel={()=>setEditing(false)} submitting={saving}/></Modal>
  </div>;
}
