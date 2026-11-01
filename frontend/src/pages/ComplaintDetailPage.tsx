import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api/http';
import { OverlapBanner } from '../components/OverlapBanner';

interface Detail {
  complaint: {
    case_number: string;
    institution_id: number;
    institution_name: string | null;
    bureau: string;
    subject: string;
    description: string;
    status: string;
    assigned_officer: string | null;
    received_at: string | null;
    due_at: string | null;
    sla_status: string;
  };
  audit_history: { id: number; actor: string; action: string; details: string | null; created_at: string | null }[];
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('en-IN') : '-');

export const ComplaintDetailPage: React.FC = () => {
  const { caseNumber } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['complaint', caseNumber],
    queryFn: () => apiFetch<Detail>(`/api/complaints/${caseNumber}`)
  });

  if (isLoading) return <p className="text-sm text-slate-600">Loading...</p>;
  if (error || !data) return <p className="text-sm text-[#B3261E]">Complaint not found.</p>;

  const c = data.complaint;
  const fields: [string, string][] = [
    ['Bureau', c.bureau],
    ['Status', c.status],
    ['SLA', c.sla_status.replace('_', ' ')],
    ['Assigned officer', c.assigned_officer ?? '-'],
    ['Received', fmt(c.received_at)],
    ['Due', fmt(c.due_at)]
  ];

  return (
    <div className="space-y-4">
      <Link to="/complaints" className="text-xs text-[#1B3A6B] hover:underline">← Back to complaints</Link>
      <OverlapBanner caseNumber={c.case_number} />
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 space-y-3">
        <div>
          <div className="font-mono text-xs text-slate-500">{c.case_number}</div>
          <h1 className="text-xl font-bold text-[#0B2447]">{c.subject}</h1>
          <Link to={`/institutions/${c.institution_id}`} className="text-sm text-[#1B3A6B] hover:underline">
            {c.institution_name}
          </Link>
        </div>
        <p className="text-sm text-slate-700">{c.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fields.map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded p-3">
              <div className="text-[11px] uppercase font-bold text-slate-500">{k}</div>
              <div className="text-sm">{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-5">
        <div className="font-bold text-sm mb-2">Audit history ({data.audit_history.length})</div>
        {data.audit_history.length === 0 ? (
          <p className="text-xs text-slate-500">No audit entries for this complaint.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {data.audit_history.map((a) => (
              <li key={a.id}>
                {fmt(a.created_at)} · {a.actor} · <strong>{a.action}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};