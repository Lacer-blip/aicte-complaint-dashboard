import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/http';
import { exportPdf, exportXlsx } from '../utils/exportUtils';

interface Complaint {
  case_number: string;
  institution_name: string | null;
  bureau: string;
  subject: string;
  status: string;
  assigned_officer: string | null;
  received_at: string | null;
  due_at: string | null;
  sla_status: string;
}

const SLA_STYLE: Record<string, string> = {
  OVERDUE: 'bg-red-100 text-[#B3261E]',
  DUE_SOON: 'bg-amber-100 text-[#B7791F]',
  ON_TRACK: 'bg-green-100 text-[#1E7B4F]',
  CLOSED: 'bg-slate-100 text-slate-600',
  NO_DEADLINE: 'bg-slate-100 text-slate-600'
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-IN') : '-');

const toExport = (list: Complaint[]) =>
  list.map((c) => ({
    Case: c.case_number,
    Institution: c.institution_name ?? '',
    Bureau: c.bureau,
    Subject: c.subject,
    Status: c.status,
    Officer: c.assigned_officer ?? '',
    Received: fmt(c.received_at),
    Due: fmt(c.due_at),
    SLA: c.sla_status
  }));

const selectCls = 'border border-[#DDE3EE] rounded px-2 py-1.5 text-sm';

export const ComplaintsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sla, setSla] = useState('ALL');
  const [bureau, setBureau] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [overlap, setOverlap] = useState('ALL');

  const complaints = useQuery({
    queryKey: ['complaints'],
    queryFn: () => apiFetch<{ items: Complaint[] }>('/api/complaints')
  });
  const overlaps = useQuery({
    queryKey: ['overlaps'],
    queryFn: () => apiFetch<{ items: { case_1: string; case_2: string }[] }>('/api/overlaps')
  });

  const items = complaints.data?.items ?? [];

  const overlapCases = useMemo(() => {
    const s = new Set<string>();
    (overlaps.data?.items ?? []).forEach((o) => {
      s.add(o.case_1);
      s.add(o.case_2);
    });
    return s;
  }, [overlaps.data]);

  const bureaus = useMemo(() => [...new Set(items.map((c) => c.bureau))].sort(), [items]);
  const statuses = useMemo(() => [...new Set(items.map((c) => c.status))].sort(), [items]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      const text = `${c.case_number} ${c.institution_name} ${c.subject} ${c.bureau}`.toLowerCase();
      const has = overlapCases.has(c.case_number);
      return (
        (!q || text.includes(q)) &&
        (sla === 'ALL' || c.sla_status === sla) &&
        (bureau === 'ALL' || c.bureau === bureau) &&
        (status === 'ALL' || c.status === status) &&
        (overlap === 'ALL' || (overlap === 'YES' ? has : !has))
      );
    });
  }, [items, search, sla, bureau, status, overlap, overlapCases]);

  if (complaints.isLoading) return <p className="text-sm text-slate-600">Loading complaints...</p>;
  if (complaints.error) return <p className="text-sm text-[#B3261E]">Could not load complaints.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#0B2447]">Complaints ({rows.length})</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case, institution, subject..."
            className="border border-[#DDE3EE] rounded px-3 py-1.5 text-sm w-64"
          />
          <select value={bureau} onChange={(e) => setBureau(e.target.value)} className={selectCls}>
            <option value="ALL">All bureaus</option>
            {bureaus.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            <option value="ALL">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={sla} onChange={(e) => setSla(e.target.value)} className={selectCls}>
            <option value="ALL">All SLA states</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DUE_SOON">Due soon</option>
            <option value="ON_TRACK">On track</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={overlap} onChange={(e) => setOverlap(e.target.value)} className={selectCls}>
            <option value="ALL">Overlap: any</option>
            <option value="YES">Has overlap</option>
            <option value="NO">No overlap</option>
          </select>
          <button
            onClick={() => exportXlsx(toExport(rows), 'complaints', 'Complaints')}
            className="text-xs font-bold bg-[#1E7B4F] text-white rounded px-3 py-1.5"
          >
            Excel
          </button>
          <button
            onClick={() => exportPdf('Complaints report', toExport(rows), 'complaints')}
            className="text-xs font-bold bg-[#0B2447] text-white rounded px-3 py-1.5"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Case', 'Institution', 'Bureau', 'Subject', 'Status', 'Officer', 'Received', 'Due', 'SLA', 'Overlap'].map(
                (h) => (
                  <th key={h} className="text-left px-3 py-2 font-bold">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.case_number} className="border-t border-[#DDE3EE]">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link to={`/complaints/${c.case_number}`} className="text-[#1B3A6B] hover:underline">
                    {c.case_number}
                  </Link>
                </td>
                <td className="px-3 py-2">{c.institution_name}</td>
                <td className="px-3 py-2">{c.bureau}</td>
                <td className="px-3 py-2">{c.subject}</td>
                <td className="px-3 py-2">{c.status}</td>
                <td className="px-3 py-2">{c.assigned_officer ?? '-'}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(c.received_at)}</td>
                <td className="px-3 py-2 tabular-nums">{fmt(c.due_at)}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${SLA_STYLE[c.sla_status] ?? ''}`}>
                    {c.sla_status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {overlapCases.has(c.case_number) && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-[#B7791F]">
                      Overlap
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};