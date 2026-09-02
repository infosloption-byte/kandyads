import React from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';

function dateInputValue(date){return new Date(date).toISOString().slice(0,10)}
const today=dateInputValue(new Date());
const defaultEnd=dateInputValue(Date.now()+14*86400000);

export default function EmployeeWorkloadPage(){
  const [from,setFrom]=React.useState('');
  const [to,setTo]=React.useState(defaultEnd);
  const [employeeId,setEmployeeId]=React.useState('');
  const [state,setState]=React.useState({loading:true,error:'',items:[],totalTasks:0});
  const [employees,setEmployees]=React.useState([]);
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.getEmployeeWorkload({from:from||undefined,to:to||undefined,employeeId:employeeId||undefined});setState({loading:false,error:'',items:r.data||[],totalTasks:r.meta?.totalTasks||0})}catch(e){setState(s=>({loading:false,error:e.message||'Unable to load employee workload',items:[],totalTasks:0}))}},[from,to,employeeId]);
  React.useEffect(()=>{api.listEmployees({pageSize:100,status:'ACTIVE'}).then(r=>setEmployees(r.data||[])).catch(()=>setEmployees([]))},[]);
  React.useEffect(()=>{load()},[load]);
  const planned=state.items.reduce((sum,item)=>sum+Number(item.plannedHours||0),0);
  const actual=state.items.reduce((sum,item)=>sum+Number(item.actualHours||0),0);
  const overdue=state.items.reduce((sum,item)=>sum+Number(item.overdueTasks||0),0);
  return <div><div className="page-head"><div><p className="eyebrow">TEAM & LABOUR</p><h1>Employee workload</h1><p>See assigned active tasks, planned hours, logged hours and overdue work by employee.</p></div><button className="icon-button" onClick={load} aria-label="Refresh employee workload"><RefreshCw size={16}/></button></div><section className="panel"><div className="table-toolbar" style={{flexWrap:'wrap'}}><label>From <input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To <input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><label>Employee <select value={employeeId} onChange={e=>setEmployeeId(e.target.value)}><option value="">All active employees</option>{employees.map(employee=><option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><span className="table-count">{state.totalTasks} active tasks</span></div></section><section className="panel" style={{marginTop:16}}><div className="dashboard-grid"><div className="metric-card"><span>Planned hours</span><strong>{planned.toFixed(1)}</strong></div><div className="metric-card"><span>Actual hours</span><strong>{actual.toFixed(1)}</strong></div><div className="metric-card"><span>Remaining hours</span><strong>{Math.max(0,planned-actual).toFixed(1)}</strong></div><div className="metric-card"><span>Overdue tasks</span><strong>{overdue}</strong></div></div></section><section className="panel table-panel" style={{marginTop:16}}><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'employee',label:'Employee',render:r=><><strong>{r.name}</strong><small>{r.department||r.code||'—'}</small></>},{key:'tasks',label:'Active tasks',render:r=>r.assignedTaskCount},{key:'planned',label:'Planned hrs',render:r=>Number(r.plannedHours||0).toFixed(1)},{key:'actual',label:'Actual hrs',render:r=>Number(r.actualHours||0).toFixed(1)},{key:'remaining',label:'Remaining',render:r=>Number(r.remainingHours||0).toFixed(1)},{key:'overdue',label:'Overdue',render:r=>r.overdueTasks},{key:'details',label:'Task detail',render:r=>r.tasks.length? <div>{r.tasks.slice(0,3).map(task=><div key={task.id}><strong>{task.title}</strong><small>{task.jobNumber} · {task.estimatedHours??0}h{task.overdue?' · overdue':''}</small></div>)}{r.tasks.length>3&&<small>+{r.tasks.length-3} more</small>}</div>:'—'}]} /></section></div>;
}
