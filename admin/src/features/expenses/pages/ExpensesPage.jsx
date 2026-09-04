import React from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import ExpenseForm from '../components/ExpenseForm';

export default function ExpensesPage(){
 const [rows,setRows]=React.useState([]),[categories,setCategories]=React.useState([]),[projects,setProjects]=React.useState([]),[jobs,setJobs]=React.useState([]),[employees,setEmployees]=React.useState([]),[query,setQuery]=React.useState(''),[open,setOpen]=React.useState(false),[loading,setLoading]=React.useState(true),[submitting,setSubmitting]=React.useState(false),[error,setError]=React.useState('');
 const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [expenses,cats,projectsRes,jobsRes,employeesRes]=await Promise.all([api.listExpenses({q:query}),api.listExpenseCategories(),api.listProjects(),api.listJobs(),api.listEmployees()]);setRows(expenses.data??[]);setCategories(cats.data??[]);setProjects(projectsRes.data??[]);setJobs(jobsRes.data??[]);setEmployees(employeesRes.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[query]);
 React.useEffect(()=>{load()},[load]);
 const submit=async(input)=>{setSubmitting(true);setError('');try{await api.createExpense(input);setOpen(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
 const columns=[{key:'number',label:'Expense'},{key:'category',label:'Category',render:r=>r.category?.name||'—'},{key:'project',label:'Project',render:r=>r.project?.number||'General'},{key:'job',label:'Job',render:r=>r.job?.number||'—'},{key:'amount',label:'Amount',render:r=>`LKR ${Number(r.amount).toLocaleString()}`},{key:'status',label:'Status'},{key:'direct',label:'Direct',render:r=>r.direct?'Yes':'No'}];
 return <><div className="page-head"><div><p className="eyebrow">COST CONTROL</p><h1>Expenses</h1><p>Record project, job and general operating expenses with approval status.</p></div><div className="page-head-actions"><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add expense</button></div></div><section className="panel table-panel"><div className="toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search expense number or notes"/></div></div><ResourceTable columns={columns} rows={rows} loading={loading} error={error}/></section><Modal open={open} title="Create expense" description="Record a direct project/job cost or general expense." onClose={()=>setOpen(false)} width="760px"><ExpenseForm categories={categories} projects={projects} jobs={jobs} employees={employees} onSubmit={submit} submitting={submitting}/></Modal></>;
}
