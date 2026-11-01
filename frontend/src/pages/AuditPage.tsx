import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/http';

interface AuditItem {
  id: number;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string | null;
  created_at: string | null;
}

function reasonOf(details: string | null): string {
  if (!details) return '-';
  try {
    return JSON.parse(details).reason || '-';
  } catch {
    return details;
  }
}

export const AuditPage: React.FC = () => {
  const [type, setType] = useState('ALL');
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit'],
    queryFn: () => apiFetch<{ items: AuditItem[] }>('/api/audit'),
    staleTime: 0
  });

  if (isLoading) return <p className="text-sm text-slate-600">Loading audit log...</p>;
  if (error || !data) return <p className="text-sm text-[#B3261E]">Could not load the audit log.</p>;

  const rows = data.items.filter((a) => type === 'ALL' || a.entity_type === type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0B2447]">Audit Log ({rows.length})</h1>
          <p className="text-xs text-slate-500">Append-only record of actions and human review decisions.</p>
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-[#DDE3EE] rounded px-2 py-1.5 text-sm"
        >
          <option value="ALL">All types</option>
          <option value="overlap">Overlap decisions</option>
          <option value="complaint">Complaints</option>
        </select>
      </div>
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Time', 'Actor', 'Action', 'Type', 'Entity', 'Reason'].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-[#DDE3EE]">
                <td className="px-3 py-2 tabular-nums text-xs">
                  {a.created_at ? new Date(a.created_at).toLocaleString('en-IN') : '-'}
                </td>
                <td className="px-3 py-2">{a.actor}</td>
                <td className="px-3 py-2 font-bold">{a.action}</td>
                <td className="px-3 py-2">{a.entity_type}</td>
                <td className="px-3 py-2 font-mono text-xs">{a.entity_id}</td>
                <td className="px-3 py-2">{reasonOf(a.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};