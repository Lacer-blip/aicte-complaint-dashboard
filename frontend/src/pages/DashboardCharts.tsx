import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiFetch } from '../api/http';

interface Complaint {
  bureau: string;
  sla_status: string;
}

const SLA_COLORS: Record<string, string> = {
  OVERDUE: '#B3261E',
  DUE_SOON: '#B7791F',
  ON_TRACK: '#1E7B4F',
  CLOSED: '#5B6B86',
  NO_DEADLINE: '#9AA7BD'
};

export const DashboardCharts: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => apiFetch<{ items: Complaint[] }>('/api/complaints')
  });
  if (!data) return null;

  const count = (key: 'bureau' | 'sla_status') => {
    const m = new Map<string, number>();
    data.items.forEach((c) => m.set(c[key], (m.get(c[key]) ?? 0) + 1));
    return [...m.entries()].map(([name, value]) => ({ name: name.replace('_', ' '), raw: name, value }));
  };

  const byBureau = count('bureau');
  const bySla = count('sla_status');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-4">
        <div className="text-sm font-bold mb-2">Complaints by bureau</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={byBureau}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1B3A6B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-4">
        <div className="text-sm font-bold mb-2">SLA status</div>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={bySla} dataKey="value" nameKey="name" outerRadius={85} label>
              {bySla.map((s) => (
                <Cell key={s.raw} fill={SLA_COLORS[s.raw] ?? '#9AA7BD'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};