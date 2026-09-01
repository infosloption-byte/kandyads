import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import LeadsPage from '../features/leads/pages/LeadsPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
import ClientDetailPage from '../features/clients/pages/ClientDetailPage';
import EnquiriesPage from '../features/enquiries/pages/EnquiriesPage';
import QuotesPage from '../features/quotes/pages/QuotesPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage';
import JobsPage from '../features/jobs/pages/JobsPage';
import JobDetailPage from '../features/jobs/pages/JobDetailPage';
import TasksPage from '../features/tasks/pages/TasksPage';
import EmployeesPage from '../features/employees/pages/EmployeesPage';
import TimeTrackingPage from '../features/time-tracking/pages/TimeTrackingPage';
import MaterialsPage from '../features/materials/pages/MaterialsPage';
import InventoryPage from '../features/inventory/pages/InventoryPage';
import VendorsPage from '../features/vendors/pages/VendorsPage';
import OutsourcingPage from '../features/outsourcing/pages/OutsourcingPage';
import ExpensesPage from '../features/expenses/pages/ExpensesPage';
import PurchasingPage from '../features/purchasing/pages/PurchasingPage';
import ProfitabilityPage from '../features/profitability/pages/ProfitabilityPage';
import InstallationsPage from '../features/installations/pages/InstallationsPage';
import InvoicesPage from '../features/invoices/pages/InvoicesPage';

const placeholderPages = [['reports','Reports'],['settings','Settings']];
function Placeholder({title}){return <div className="page-head"><div><p className="eyebrow">MODULE</p><h1>{title}</h1><p>This module is structured and ready for its API-backed workflow.</p></div><button className="primary">+ Add {title.replace(/s$/,'')}</button></div>}
export default function AdminRouter(){return <Routes>
 <Route path="/" element={<DashboardPage/>}/><Route path="/leads" element={<LeadsPage/>}/><Route path="/clients" element={<ClientsPage/>}/><Route path="/clients/:id" element={<ClientDetailPage/>}/><Route path="/enquiries" element={<EnquiriesPage/>}/><Route path="/quotes" element={<QuotesPage/>}/><Route path="/projects" element={<ProjectsPage/>}/><Route path="/projects/:id" element={<ProjectDetailPage/>}/><Route path="/jobs" element={<JobsPage/>}/><Route path="/jobs/:id" element={<JobDetailPage/>}/><Route path="/tasks" element={<TasksPage/>}/><Route path="/employees" element={<EmployeesPage/>}/><Route path="/time" element={<TimeTrackingPage/>}/><Route path="/materials" element={<MaterialsPage/>}/><Route path="/inventory" element={<InventoryPage/>}/><Route path="/vendors" element={<VendorsPage/>}/><Route path="/outsourcing" element={<OutsourcingPage/>}/><Route path="/expenses" element={<ExpensesPage/>}/><Route path="/purchasing" element={<PurchasingPage/>}/><Route path="/profitability" element={<ProfitabilityPage/>}/><Route path="/installations" element={<InstallationsPage/>}/><Route path="/invoices" element={<InvoicesPage/>}/>
 {placeholderPages.map(([path,title])=><Route key={path} path={`/${path}`} element={<Placeholder title={title}/>}/>)}
 </Routes>}
