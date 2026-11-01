import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api/http';

interface Complaint {
  case_number: string;
  bureau: string;
  subject: string;
  status: string;
  due_at: string | null;
  sla_status: string;
}

interface Detail {
  institution: { id: number; permanent_id: string | null; name: string; district: string; state: string; pincode: string };
  complaint_count: number;
  complaints: Complaint[];
}

export const InstitutionDetailPage: React.FC = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['institution', id],
    queryFn: () => apiFetch<Detail>(`/api/institutions/${id}`)
  });

  if (isLoading) return <p className="text-sm text-slate-600">Loading...</p>;
  if (error || !data) return <p className="text-sm text-[#B3261E]">Institution not found.</p>;

  const i = data.institution;
  return (
    <div className="space-y-4">
      <Link to="/institutions" className="text-xs text-[#1B3A6B] hover:underline">← Back to institutions</Link>
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-5">
        <h1 className="text-xl font-bold text-[#0B2447]">{i.name}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {i.district}, {i.state} · PIN {i.pincode} · ID {i.permanent_id ?? 'not assigned'}
        </p>
      </div>
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-x-auto">
        <div className="px-4 py-3 font-bold text-sm border-b border-[#DDE3EE]">
          Complaints ({data.complaint_count})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Case', 'Bureau', 'Subject', 'Status', 'SLA'].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.complaints.map((c) => (
              <tr key={c.case_number} className="border-t border-[#DDE3EE]">
                <td className="px-3 py-2 font-mono text-xs">
                  <Link to={`/complaints/${c.case_number}`} className="text-[#1B3A6B] hover:underline">
                    {c.case_number}
                  </Link>
                </td>
                <td className="px-3 py-2">{c.bureau}</td>
                <td className="px-3 py-2">{c.subject}</td>
                <td className="px-3 py-2">{c.status}</td>
                <td className="px-3 py-2">{c.sla_status.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};