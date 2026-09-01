import React from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import OutsourceOrderForm from '../components/OutsourceOrderForm';

export default function OutsourcingPage(){
 const [rows,setRows]=React.useState([]),[jobs,setJobs]=React.useState([]),[vendors,setVendors]=React.useState([]),[query,setQuery]=React.useState(''),[open,setOpen]=React.useState(false),[loading,setLoading]=React.useState(true),[submitting,setSubmitting]=React.useState(false),[error,setError]=React.useState('');
 const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [orders,jobsRes,vendorsRes]=await Promise.all([api.listOutsourcing({q:query}),api.listJobs(),api.listVendors()]);setRows(orders.data??[]);setJobs(jobsRes.data??[]);setVendors(vendorsRes.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[query]);
 React.useEffect(()=>{load()},[load]);
 const submit=async(input)=>{setSubmitting(true);setError('');try{await api.createOutsourceOrder(input);setOpen(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
 const columns=[{key:'number',label:'Order'},{key:'job',label:'Job',render:r=>r.job?`${r.job.number} · ${r.job.title}`:'—'},{key:'vendor',label:'Vendor',render:r=>r.vendor?.companyName||'—'},{key:'agreedCost',label:'Cost',render:r=>`LKR ${Number(r.agreedCost).toLocaleString()}`},{key:'status',label:'Status'},{key:'dueDate',label:'Due',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}];
 return <><div className="page-head"><div><p className="eyebrow">THIRD-PARTY PRODUCTION</p><h1>Outsourcing</h1><p>Track vendor production orders and agreed external costs.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New order</button></div><div className="toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order or scope"/></div></div><ResourceTable columns={columns} rows={rows} loading={loading} error={error}/><Modal open={open} title="New outsource order" description="Assign a production scope to a vendor." onClose={()=>setOpen(false)} width="760px"><OutsourceOrderForm jobs={jobs} vendors={vendors} onSubmit={submit} submitting={submitting}/></Modal></>;
}
