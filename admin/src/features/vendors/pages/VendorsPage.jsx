import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import VendorForm from '../components/VendorForm';

export default function VendorsPage(){
  const [rows,setRows]=React.useState([]),[query,setQuery]=React.useState(''),[open,setOpen]=React.useState(false),[loading,setLoading]=React.useState(true),[submitting,setSubmitting]=React.useState(false),[error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const r=await api.listVendors({q:query});setRows(r.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[query]);
  React.useEffect(()=>{load()},[load]);
  const submit=async(input)=>{setSubmitting(true);setError('');try{await api.createVendor(input);setOpen(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
  const columns=[{key:'code',label:'Code'},{key:'companyName',label:'Vendor',render:r=><Link to={`/vendors/${r.id}`} className="table-link">{r.companyName}</Link>},{key:'category',label:'Category'},{key:'phone',label:'Phone'},{key:'assignments',label:'Jobs',render:r=>r._count?.assignments??0},{key:'orders',label:'Outsource orders',render:r=>r._count?.outsourceOrders??0}];
  return <><div className="page-head"><div><p className="eyebrow">SUPPLIERS / PARTNERS</p><h1>Vendors</h1><p>Maintain third-party suppliers and production partners.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add vendor</button></div><div className="toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search vendors"/></div></div><ResourceTable columns={columns} rows={rows} loading={loading} error={error}/><Modal open={open} title="Create vendor" description="Add a production partner or supplier." onClose={()=>setOpen(false)} width="720px"><VendorForm onSubmit={submit} submitting={submitting}/></Modal></>;
}
