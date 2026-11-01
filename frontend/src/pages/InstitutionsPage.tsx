import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/http';

interface Institution {
  id: number;
  permanent_id: string | null;
  name: string;
  district: string;
  state: string;
  pincode: string;
  complaint_count: number;
}

export const InstitutionsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => apiFetch<{ items: Institution[] }>('/api/institutions')
  });

  if (isLoading) return <p className="text-sm text-slate-600">Loading institutions...</p>;
  if (error || !data) return <p className="text-sm text-[#B3261E]">Could not load institutions.</p>;

  const q = search.trim().toLowerCase();
  const rows = data.items.filter((i) => !q || `${i.name} ${i.district} ${i.permanent_id}`.toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#0B2447]">Institutions ({rows.length})</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, district, ID..."
          className="border border-[#DDE3EE] rounded px-3 py-1.5 text-sm w-64"
        />
      </div>
      <div className="bg-white border border-[#DDE3EE] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {['Name', 'Permanent ID', 'District', 'State', 'PIN', 'Complaints'].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-[#DDE3EE]">
                <td className="px-3 py-2">
                  <Link to={`/institutions/${i.id}`} className="text-[#1B3A6B] font-bold hover:underline">
                    {i.name}
                  </Link>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{i.permanent_id ?? '-'}</td>
                <td className="px-3 py-2">{i.district}</td>
                <td className="px-3 py-2">{i.state}</td>
                <td className="px-3 py-2">{i.pincode}</td>
                <td className="px-3 py-2 tabular-nums">{i.complaint_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};