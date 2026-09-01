import React from 'react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';
import '../styles/profitability.css';

const money = (value) => `LKR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ProfitabilityPage() {
  const [projects, setProjects] = React.useState([]);
  const [jobs, setJobs] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [projectResult, jobResult, totals] = await Promise.all([
        api.listProfitabilityProjects(),
        api.listProfitabilityJobs(),
        api.getProfitabilitySummary(),
      ]);
      setProjects(projectResult.data ?? []);
      setJobs(jobResult.data ?? []);
      setSummary(totals.data ?? null);
    } catch (e) { setError(e.message || 'Unable to load profitability.'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const projectColumns = [
    { key: 'number', label: 'Project' },
    { key: 'name', label: 'Project name' },
    { key: 'clientName', label: 'Client' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'revenue', label: 'Revenue', render: r => money(r.revenue) },
    { key: 'actualCost', label: 'Actual cost', render: r => money(r.actualCost) },
    { key: 'grossProfit', label: 'Gross profit', render: r => <strong className={Number(r.grossProfit) >= 0 ? 'positive' : 'negative'}>{money(r.grossProfit)}</strong> },
    { key: 'marginPercent', label: 'Margin', render: r => r.marginPercent == null ? '—' : `${Number(r.marginPercent).toFixed(1)}%` },
  ];

  const jobColumns = [
    { key: 'number', label: 'Job', render: r => <><strong>{r.job.number}</strong><small>{r.job.title}</small></> },
    { key: 'project', label: 'Project', render: r => r.job.projectName },
    { key: 'service', label: 'Service', render: r => r.job.service || '—' },
    { key: 'hours', label: 'Hours' },
    { key: 'revenue', label: 'Revenue', render: r => money(r.revenue) },
    { key: 'actual', label: 'Actual cost', render: r => money(r.actual.total) },
    { key: 'grossProfit', label: 'Gross profit', render: r => <strong className={Number(r.grossProfit) >= 0 ? 'positive' : 'negative'}>{money(r.grossProfit)}</strong> },
    { key: 'marginPercent', label: 'Margin', render: r => r.marginPercent == null ? '—' : `${Number(r.marginPercent).toFixed(1)}%` },
  ];

  return <>
    <div className="page-head">
      <div><p className="eyebrow">TEAM & FINANCE / PROFITABILITY</p><h1>Profitability</h1><p>See project and production-job performance from the real costs recorded in operations.</p></div>
      <button className="secondary" onClick={load}>Refresh</button>
    </div>

    {summary && <div className="stat-grid">
      <div className="stat"><span>Projects</span><strong>{summary.projects}</strong></div>
      <div className="stat"><span>Jobs</span><strong>{summary.jobs}</strong></div>
      <div className="stat"><span>Revenue</span><strong>{money(summary.revenue)}</strong></div>
      <div className="stat"><span>Actual cost</span><strong>{money(summary.actualCost)}</strong></div>
      <div className="stat"><span>Gross profit</span><strong className={Number(summary.grossProfit) >= 0 ? 'positive' : 'negative'}>{money(summary.grossProfit)}</strong></div>
      <div className="stat"><span>Margin</span><strong>{summary.marginPercent == null ? '—' : `${Number(summary.marginPercent).toFixed(1)}%`}</strong></div>
    </div>}

    <section>
      <div className="panel-head"><div><span>PROJECT PROFITABILITY</span><h2>Project performance</h2></div></div>
      <ResourceTable columns={projectColumns} rows={projects} loading={loading} error={error}/>
    </section>

    <section className="profitability-detail">
      <div className="panel-head"><div><span>JOB COST ENGINE</span><h2>Production job performance</h2></div></div>
      <p className="muted">Actual job cost combines employee time, job stock usage, received outsourcing and approved or paid direct expenses. Returned stock reduces material cost.</p>
      <div style={{ marginTop: 18 }}><ResourceTable columns={jobColumns} rows={jobs} loading={loading} error={error} /></div>
    </section>
  </>;
}
