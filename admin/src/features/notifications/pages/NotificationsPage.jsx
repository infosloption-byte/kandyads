import React from 'react';
import { CheckCheck, RefreshCw } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';

export default function NotificationsPage(){
  const [rows,setRows]=React.useState([]);const [unread,setUnread]=React.useState(0);const [loading,setLoading]=React.useState(true);const [error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const r=await api.listNotifications();setRows(r.data??[]);setUnread(Number(r.meta?.unreadCount||0))}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  React.useEffect(()=>{load()},[load]);
  const mark=async id=>{try{await api.markNotificationRead(id);setRows(x=>x.map(n=>n.id===id?{...n,readAt:new Date().toISOString()}:n));setUnread(x=>Math.max(0,x-1))}catch(e){setError(e.message)}};
  const readAll=async()=>{try{await api.markAllNotificationsRead();setRows(x=>x.map(n=>({...n,readAt:new Date().toISOString()})));setUnread(0)}catch(e){setError(e.message)}};
  const generate=async()=>{try{await api.generateNotifications();await load()}catch(e){setError(e.message)}};
  const columns=[{key:'title',label:'Notification',render:n=><div><strong>{n.title}</strong><div className="muted">{n.message}</div></div>},{key:'type',label:'Type',render:n=><span className="table-status">{n.type}</span>},{key:'createdAt',label:'Received',render:n=>new Date(n.createdAt).toLocaleString()},{key:'readAt',label:'State',render:n=>n.readAt?'Read':<strong>Unread</strong>},{key:'action',label:'',render:n=>!n.readAt&&<button className="secondary" onClick={()=>mark(n.id)}><CheckCheck size={14}/> Mark read</button>}];
  return <><div className="page-head"><div><p className="eyebrow">COMMAND CENTER / NOTIFICATIONS</p><h1>Notifications <span className="count-badge">{unread} unread</span></h1><p>Operational alerts for assignments, task deadlines and inventory thresholds.</p></div><div style={{display:'flex',gap:8}}><button className="secondary" onClick={generate}><RefreshCw size={15}/> Refresh alerts</button>{unread>0&&<button className="primary" onClick={readAll}><CheckCheck size={15}/> Mark all read</button>}</div></div><ResourceTable columns={columns} rows={rows} loading={loading} error={error}/></>;
}
