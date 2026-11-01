import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiFetch } from '../api/http';

interface Complaint {
  institution_id: number;
  institution_name: string | null;
  status: string;
  received_at: string | null;
}

interface Overlap {
  case_1: string;
  case_2: string;
  institution_1: string;
  bureau_1: string;
  bureau_2: string;
  confidence: string;
  subject_similarity: number;
}

const CLOSED = ['closed', 'resolved', 'disposed', 'rejected'];

const BUCKETS = [
  { name: '0-15 days', max: 15 },
  { name: '16-30 days', max: 30 },
  { name: '31-60 days', max: 60 },
  { name: '60+ days', max: Infinity }
];

export const DashboardInsights: React.FC = () => {
  const complaints = useQuery({
    queryKey: ['complaints'],
    queryFn: () => apiFetch<{ items: Complaint[] }>('/api/complaints')
  });
  const overlaps = useQuery({
    queryKey: ['overlaps'],
    queryFn: () => apiFetch<{ items: Overlap[] }>('/api/overlaps')
  });

  const active = (complaints.data?.items ?? []).filter(
    (c) => !CLOSED.includes((c.status || '').trim().toLowerCase())
  );

  const now = Date.now();
  const ageing = BUCKETS.map((b) => ({ name: b.name, max: b.max, value: 0 }));
  for (const c of active) {
    if (!c.received_at) continue;
    const days = Math.max(0, Math.floor((now - new Date(c.received_at).getTime()) / 86400000));
    const bucket = ageing.find((b) => days <= b.max);
    if (bucket) bucket.value += 1;
  }

  const byInstitution = new Map<number, { name: string; count: number }>();
  for (const c of active) {
    const entry = byInstitution.get(c.institution_id) ?? { name: c.institution_name ?? 'Unknown', count: 0 };
    entry.count += 1;
    byInstitution.set(c.institution_id, entry);
  }
  const topInstitutions = [...byInstitution.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  const topOverlaps = [...(overlaps.data?.items ?? [])]
    .sort((a, b) => b.subject_similarity - a.subject_similarity)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
        <div className="flex items-center gap-2 font-bold text-[#7A5410] text-sm">
          <AlertTriangle className="w-4 h-4" />
          Potential Overlapping Cases: Coordination Required ({overlaps.data?.items.length ?? 0})
        </div>
        {topOverlaps.length === 0 ? (
          <p className="text-xs text-slate-600 mt-2">No overlaps detected.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {topOverlaps.map((o) => (
              <li key={`${o.case_1}|${o.case_2}`}>
                <span className="font-mono text-xs">{o.case_1}</span>
                <span className="mx-1 text-slate-400">and</span>
                <span className="font-mono text-xs">{o.case_2}</span>
                <span className="text-slate-600"> · {o.institution_1} · {o.bureau_1} / {o.bureau_2}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/overlaps" className="inline-block mt-2 text-xs font-bold text-[#1B3A6B] hover:underline">
          Review all overlaps
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#DDE3EE] rounded-lg p-4">
          <div className="text-sm font-bold mb-2">Pending ageing (active cases)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageing}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#B7791F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-[#DDE3EE] rounded-lg p-4">
          <div className="text-sm font-bold mb-2">Top institutions by open cases</div>
          {topInstitutions.length === 0 ? (
            <p className="text-xs text-slate-500">No active cases.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {topInstitutions.map(([id, v]) => (
                <li key={id} className="flex justify-between border-b border-[#DDE3EE] pb-1">
                  <Link to={`/institutions/${id}`} className="text-[#1B3A6B] hover:underline">
                    {v.name}
                  </Link>
                  <strong className="tabular-nums">{v.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};