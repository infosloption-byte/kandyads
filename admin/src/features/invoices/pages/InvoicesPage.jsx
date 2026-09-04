import React from 'react';
import { Plus, Search, CreditCard, FileText } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';

const money = (v) => `LKR ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Field({ label, children }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}

export default function InvoicesPage() {
  const [rows, setRows] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [projects, setProjects] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [pdfLoading, setPdfLoading] = React.useState(null);

  const [form, setForm] = React.useState({
    number: '', clientId: '', projectId: '', invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '', description: 'Service delivery', quantity: 1, unit: 'Job', rate: 0, tax: 0, discount: 0,
  });
  const [payment, setPayment] = React.useState({
    amount: '', paidAt: new Date().toISOString().slice(0, 10), method: 'BANK_TRANSFER', reference: '', notes: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [i, c, p] = await Promise.all([api.listInvoices({ q: query }), api.listClients(), api.listProjects()]);
      setRows(i.data ?? []);
      setClients(c.data ?? []);
      setProjects(p.data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true);
    setError('');
    try {
      const subtotal = Number(form.quantity) * Number(form.rate);
      const total = Math.max(0, subtotal - Number(form.discount || 0) + Number(form.tax || 0));
      await api.createInvoice({
        number: form.number,
        clientId: Number(form.clientId),
        projectId: form.projectId ? Number(form.projectId) : null,
        invoiceDate: new Date(form.invoiceDate).toISOString(),
        dueDate: new Date(form.dueDate || form.invoiceDate).toISOString(),
        subtotal,
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        total,
        status: 'ISSUED',
        items: [{ description: form.description, quantity: Number(form.quantity), unit: form.unit, rate: Number(form.rate), total: subtotal }],
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openPayment = (row) => {
    setSelected(row);
    setPayment({ ...payment, amount: Number(row.balance || 0).toFixed(2) });
    setPayOpen(true);
  };

  const savePayment = async () => {
    setSaving(true);
    setError('');
    try {
      await api.createPayment({
        invoiceId: selected.id,
        amount: Number(payment.amount),
        paidAt: new Date(payment.paidAt).toISOString(),
        method: payment.method,
        reference: payment.reference || null,
        notes: payment.notes || null,
      });
      setPayOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async (row) => {
    setPdfLoading(row.id);
    setError('');
    try {
      const url = await api.downloadInvoicePdf(row.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${String(row.number || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setPdfLoading(null);
    }
  };

  const columns = [
    { key: 'number', label: 'Invoice' },
    { key: 'client', label: 'Client', render: (r) => r.client?.companyName || '—' },
    { key: 'project', label: 'Project', render: (r) => r.project?.number || '—' },
    { key: 'invoiceDate', label: 'Date', render: (r) => new Date(r.invoiceDate).toLocaleDateString() },
    { key: 'total', label: 'Total', render: (r) => money(r.total) },
    { key: 'amountPaid', label: 'Paid', render: (r) => money(r.amountPaid) },
    { key: 'balance', label: 'Balance', render: (r) => <strong>{money(r.balance)}</strong> },
    { key: 'status', label: 'Status', render: (r) => <span className="table-status">{r.status}</span> },
    {
      key: 'action',
      label: 'Actions',
      render: (r) => (
        <div className="table-actions">
          <button className="secondary table-action" onClick={() => downloadPdf(r)} disabled={pdfLoading === r.id}>
            <FileText size={14} />
            {pdfLoading === r.id ? 'PDF…' : 'PDF'}
          </button>
          {Number(r.balance) > 0 && r.status !== 'CANCELLED' ? (
            <button className="secondary table-action" onClick={() => openPayment(r)}>
              <CreditCard size={14} />
              Record payment
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">TEAM &amp; FINANCE / INVOICING</p>
          <h1>Invoices</h1>
          <p>Issue customer invoices, download printable PDFs, track partial payments and monitor outstanding balances.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}><Plus size={16} /> New invoice</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoice or client" />
        </div>
      </div>

      <ResourceTable columns={columns} rows={rows} loading={loading} error={error} />

      <Modal open={open} title="New invoice" description="Create an invoice for a client or project." onClose={() => setOpen(false)} width="780px">
        <div className="form-grid form-grid-2">
          <Field label="Invoice number"><input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="INV-2026-001" /></Field>
          <Field label="Client">
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: '' })}>
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.companyName}</option>)}
            </select>
          </Field>
          <Field label="Project (optional)">
            <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              <option value="">Select project</option>
              {projects.filter((p) => !form.clientId || p.clientId === Number(form.clientId)).map((p) => (
                <option key={p.id} value={p.id}>{p.number} · {p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Invoice date"><input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} /></Field>
          <Field label="Due date"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Quantity"><input type="number" min="0.001" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
          <Field label="Unit"><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
          <Field label="Rate (LKR)"><input type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></Field>
          <Field label="Discount (LKR)"><input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></Field>
          <Field label="Tax (LKR)"><input type="number" min="0" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></Field>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="primary" disabled={saving || !form.number || !form.clientId} onClick={create}>{saving ? 'Creating…' : 'Create invoice'}</button>
        </div>
      </Modal>

      <Modal open={payOpen} title={`Record payment · ${selected?.number || ''}`} description="Payment is applied transactionally to the invoice balance." onClose={() => setPayOpen(false)} width="560px">
        <div className="detail-grid">
          <div><span>Outstanding</span><strong>{money(selected?.balance)}</strong></div>
          <div><span>Status</span><strong>{selected?.status || '—'}</strong></div>
        </div>
        <div className="form-grid">
          <Field label="Payment amount (LKR)"><input type="number" min="0.01" step="0.01" max={Number(selected?.balance || 0)} value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} /></Field>
          <Field label="Paid date"><input type="date" value={payment.paidAt} onChange={(e) => setPayment({ ...payment, paidAt: e.target.value })} /></Field>
          <Field label="Method">
            <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </Field>
          <Field label="Reference"><input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} /></Field>
          <Field label="Notes"><textarea value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} /></Field>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="secondary" onClick={() => setPayOpen(false)}>Cancel</button>
          <button className="primary" disabled={saving || !selected || Number(payment.amount) <= 0} onClick={savePayment}>{saving ? 'Saving…' : 'Record payment'}</button>
        </div>
      </Modal>
    </>
  );
}
