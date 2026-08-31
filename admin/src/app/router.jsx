import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import ClientsPage from '../features/clients/pages/ClientsPage';
import EnquiriesPage from '../features/enquiries/pages/EnquiriesPage';
import QuotesPage from '../features/quotes/pages/QuotesPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';

const modulePages = [
  ['leads','Leads'],['jobs','Jobs'],['tasks','Tasks'],['materials','Materials'],['inventory','Inventory'],['purchasing','Purchasing'],['outsourcing','Outsourcing'],['installations','Installations'],['employees','Employees'],['time','Time Tracking'],['expenses','Expenses'],['invoices','Invoices'],['profitability','Profitability'],['reports','Reports'],['settings','Settings'],
];

function Placeholder({ title }) {
  return <div className="page-head"><div><p className="eyebrow">MODULE</p><h1>{title}</h1><p>This module is structured and ready for its API-backed workflow.</p></div><button className="primary">+ Add {title.replace(/s$/,'')}</button></div>;
}

export default function AdminRouter(){
  return <Routes>
    <Route path="/" element={<DashboardPage/>}/>
    <Route path="/clients" element={<ClientsPage/>}/>
    <Route path="/enquiries" element={<EnquiriesPage/>}/>
    <Route path="/quotes" element={<QuotesPage/>}/>
    <Route path="/projects" element={<ProjectsPage/>}/>
    {modulePages.map(([path,title]) => <Route key={path} path={`/${path}`} element={<Placeholder title={title}/>}/>)}
  </Routes>;
}
