import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import LeadsPage from '../features/leads/pages/LeadsPage';
import LeadDetailPage from '../features/leads/pages/LeadDetailPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
import ClientDetailPage from '../features/clients/pages/ClientDetailPage';
import EnquiriesPage from '../features/enquiries/pages/EnquiriesPage';
import EnquiryDetailPage from '../features/enquiries/pages/EnquiryDetailPage';
import QuotesPage from '../features/quotes/pages/QuotesPage';
import QuoteDetailPage from '../features/quotes/pages/QuoteDetailPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage';
import JobsPage from '../features/jobs/pages/JobsPage';
import JobDetailPage from '../features/jobs/pages/JobDetailPage';
import TasksPage from '../features/tasks/pages/TasksPage';
import TaskDetailPage from '../features/tasks/pages/TaskDetailPage';
import EmployeesPage from '../features/employees/pages/EmployeesPage';
import EmployeeWorkloadPage from '../features/employees/pages/EmployeeWorkloadPage';
import EmployeeCapabilitiesPage from '../features/employees/pages/EmployeeCapabilitiesPage';
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
import SettingsPage from '../features/settings/pages/SettingsPage';
import ApprovalsPage from '../features/approvals/pages/ApprovalsPage';
import { canAccessPath } from '../config/navigation';

const placeholderPages = [['reports','Reports']];
function Placeholder({title}){return <div className="page-head"><div><p className="eyebrow">MODULE</p><h1>{title}</h1><p>This module is structured and ready for its API-backed workflow.</p></div></div>}
function AccessDenied(){return <div className="page-head"><div><p className="eyebrow">ACCESS RESTRICTED</p><h1>Access restricted</h1><p>Your role does not have permission to open this module.</p></div></div>}

export default function AdminRouter({ user }) {
  const location = useLocation();
  if (!canAccessPath(location.pathname, user?.permissions || [])) return <AccessDenied />;
  return <Routes>
   <Route path="/" element={<DashboardPage/>}/><Route path="/leads" element={<LeadsPage/>}/><Route path="/leads/:id" element={<LeadDetailPage/>}/><Route path="/clients" element={<ClientsPage/>}/><Route path="/clients/:id" element={<ClientDetailPage/>}/><Route path="/enquiries" element={<EnquiriesPage/>}/><Route path="/enquiries/:id" element={<EnquiryDetailPage/>}/><Route path="/quotes" element={<QuotesPage/>}/><Route path="/quotes/:id" element={<QuoteDetailPage/>}/><Route path="/projects" element={<ProjectsPage/>}/><Route path="/projects/:id" element={<ProjectDetailPage/>}/><Route path="/jobs" element={<JobsPage/>}/><Route path="/jobs/:id" element={<JobDetailPage/>}/><Route path="/tasks" element={<TasksPage/>}/><Route path="/tasks/:id" element={<TaskDetailPage/>}/><Route path="/employees" element={<EmployeesPage/>}/><Route path="/employees/workload" element={<EmployeeWorkloadPage/>}/><Route path="/employees/capabilities" element={<EmployeeCapabilitiesPage/>}/><Route path="/time" element={<TimeTrackingPage/>}/><Route path="/materials" element={<MaterialsPage/>}/><Route path="/inventory" element={<InventoryPage/>}/><Route path="/vendors" element={<VendorsPage/>}/><Route path="/outsourcing" element={<OutsourcingPage/>}/><Route path="/expenses" element={<ExpensesPage/>}/><Route path="/purchasing" element={<PurchasingPage/>}/><Route path="/profitability" element={<ProfitabilityPage/>}/><Route path="/installations" element={<InstallationsPage/>}/><Route path="/invoices" element={<InvoicesPage/>}/><Route path="/approvals" element={<ApprovalsPage/>}/><Route path="/settings" element={<SettingsPage/>}/>
   {placeholderPages.map(([path,title])=><Route key={path} path={`/${path}`} element={<Placeholder title={title}/>}/>)}
  </Routes>;
}