import React from 'react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';

const money = (value) => `LKR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ProfitabilityPage() {
  const [rows, setRows] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [projects, totals] = await Promise.all([api.listProfitabilityProjects(), api.getProfitabilitySummary()]);
      setRows(projects.data ?? []); setSummary(totals.data ?? null);
    } catch (e) { setError(e.message || 'Unable to load profitability.'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'number', label: 'Project' },
    { key: 'name', label: 'Project name' },
    { key: 'clientName', label: 'Client' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'revenue', label: 'Revenue', render: r => money(r.revenue) },
    { key: 'actualCost', label: 'Actual cost', render: r => money(r.actualCost) },
    { key: 'grossProfit', label: 'Gross profit', render: r => <strong className={Number(r.grossProfit) >= 0 ? 'positive' : 'negative'}>{money(r.grossProfit)}</strong> },
    { key: 'marginPercent', label: 'Margin', render: r => r.marginPercent == null ? '—' : `${Number(r.marginPercent).toFixed(1)}%` },
    { key: 'status', label: 'Status' },
  ];

  return <>
    <div className="page-head">
      <div><p className="eyebrow">TEAM & FINANCE / PROFITABILITY</p><h1>Profitability</h1><p>See revenue, actual delivery cost and gross margin across projects.</p></div>
      <button className="secondary" onClick={load}>Refresh</button>
    </div>

    {summary && <div className="stats-grid">
      <div className="stat-card"><span>Projects</span><strong>{summary.projects}</strong></div>
      <div className="stat-card"><span>Jobs</span><strong>{summary.jobs}</strong></div>
      <div className="stat-card"><span>Revenue</span><strong>{money(summary.revenue)}</strong></div>
      <div className="stat-card"><span>Actual cost</span><strong>{money(summary.actualCost)}</strong></div>
      <div className="stat-card"><span>Gross profit</span><strong className={Number(summary.grossProfit) >= 0 ? 'positive' : 'negative'}>{money(summary.grossProfit)}</strong></div>
      <div className="stat-card"><span>Margin</span><strong>{summary.marginPercent == null ? '—' : `${Number(summary.marginPercent).toFixed(1)}%`}</strong></div>
    </div>}

    <ResourceTable columns={columns} rows={rows} loading={loading} error={error}/>

    <div className="section-card" style={{ marginTop: 24 }}>
      <div className="section-card-head"><div><p className="eyebrow">JOB COST ENGINE</p><h2>Actual job costs</h2></div></div>
      <p className="muted">Project profitability is calculated from actual labour time, job stock movements, non-cancelled outsourcing and approved or paid direct expenses.</p>
    </div>
  </>;
}
