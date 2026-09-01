import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
import EnquiriesPage from '../features/enquiries/pages/EnquiriesPage';
import QuotesPage from '../features/quotes/pages/QuotesPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';
import JobsPage from '../features/jobs/pages/JobsPage';
import TasksPage from '../features/tasks/pages/TasksPage';
import EmployeesPage from '../features/employees/pages/EmployeesPage';
import TimeTrackingPage from '../features/time-tracking/pages/TimeTrackingPage';
import MaterialsPage from '../features/materials/pages/MaterialsPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import VendorsPage from '../features/vendors/pages/VendorsPage';
import OutsourcingPage from '../features/outsourcing/pages/OutsourcingPage';
import ExpensesPage from '../features/expenses/pages/ExpensesPage';

const placeholderPages = [
  ['leads','Leads'],['purchasing','Purchasing'],['installations','Installations'],['invoices','Invoices'],['profitability','Profitability'],['reports','Reports'],['settings','Settings'],
];
function Placeholder({title}){return <div className="page-head"><div><p className="eyebrow">MODULE</p><h1>{title}</h1><p>This module is structured and ready for its API-backed workflow.</p></div><button className="primary">+ Add {title.replace(/s$/,'')}</button></div>}
export default function AdminRouter(){return <Routes>
 <Route path="/" element={<DashboardPage/>}/><Route path="/clients" element={<ClientsPage/>}/><Route path="/enquiries" element={<EnquiriesPage/>}/><Route path="/quotes" element={<QuotesPage/>}/><Route path="/projects" element={<ProjectsPage/>}/><Route path="/jobs" element={<JobsPage/>}/><Route path="/tasks" element={<TasksPage/>}/><Route path="/employees" element={<EmployeesPage/>}/><Route path="/time" element={<TimeTrackingPage/>}/><Route path="/materials" element={<MaterialsPage/>}/><Route path="/inventory" element={<InventoryPage/>}/><Route path="/vendors" element={<VendorsPage/>}/><Route path="/outsourcing" element={<OutsourcingPage/>}/><Route path="/expenses" element={<ExpensesPage/>}/>
 {placeholderPages.map(([path,title])=><Route key={path} path={`/${path}`} element={<Placeholder title={title}/>}/>)}
 </Routes>}
