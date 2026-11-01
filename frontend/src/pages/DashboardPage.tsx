import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/http';
import { DashboardCharts } from './DashboardCharts';

interface Summary {
  total_complaints: number;
  active_complaints: number;
  overdue_complaints: number;
  due_soon_complaints: number;
  total_institutions: number;
  potential_overlaps: number;
}

const Card: React.FC<{ label: string; value: number; color: string; note?: string }> = ({
  label,
  value,
  color,
  note
}) => (
  <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 shadow-sm">
    <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
    <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color }}>
      {value}
    </div>
    {note && <div className="text-[11px] text-slate-500 mt-1">{note}</div>}
  </div>
);

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['summary'],
    queryFn: () => apiFetch<Summary>('/api/dashboard/summary')
  });

  if (isLoading) return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  if (error || !data)
    return <p className="text-sm text-[#B3261E]">Could not load the dashboard. Is the backend running?</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0B2447]">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card label="Total complaints" value={data.total_complaints} color="#0B2447" />
        <Card label="Active complaints" value={data.active_complaints} color="#1B3A6B" />
        <Card label="Overdue" value={data.overdue_complaints} color="#B3261E" note="Past their due date" />
        <Card label="Due soon" value={data.due_soon_complaints} color="#B7791F" note="Within 48 hours" />
        <Card label="Institutions" value={data.total_institutions} color="#1E7B4F" />
        <Card
          label="Potential overlaps"
          value={data.potential_overlaps}
          color="#1B3A6B"
          note="Suggestions only, human review required"
        />
              <DashboardCharts />
      </div>
    </div>
  );
};