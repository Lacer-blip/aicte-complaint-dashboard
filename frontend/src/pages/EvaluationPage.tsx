import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/http';

type Pair = string[];

interface Evaluation {
  dataset: string | null;
  scope: string;
  precision: number;
  recall: number;
  f1: number;
  predicted_count: number;
  true_positives: Pair[];
  false_positives: Pair[];
  false_negatives: Pair[];
  negative_pairs_wrongly_flagged: Pair[];
  negative_pairs_total: number;
}

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

const Metric: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 shadow-sm">
    <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
    <div className="text-3xl font-extrabold mt-1 tabular-nums" style={{ color }}>
      {value}
    </div>
  </div>
);

const PairList: React.FC<{ title: string; pairs: Pair[]; color: string }> = ({ title, pairs, color }) => (
  <div className="bg-white border border-[#DDE3EE] rounded-lg p-4">
    <div className="text-sm font-bold mb-2" style={{ color }}>
      {title} ({pairs.length})
    </div>
    {pairs.length === 0 ? (
      <p className="text-xs text-slate-500">None</p>
    ) : (
      <ul className="text-xs font-mono space-y-1">
        {pairs.map((p) => (
          <li key={p.join('|')}>
            {p[0]} and {p[1]}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const EvaluationPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['evaluation'],
    queryFn: () => apiFetch<Evaluation>('/api/evaluation')
  });

  if (isLoading) return <p className="text-sm text-slate-600">Loading evaluation...</p>;
  if (error || !data)
    return <p className="text-sm text-[#B3261E]">Could not load the evaluation. Is the backend updated?</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0B2447]">Matching Evaluation</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overlap detection compared with a known answer key. Scope: {data.scope}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Precision" value={pct(data.precision)} color="#1B3A6B" />
        <Metric label="Recall" value={pct(data.recall)} color="#1E7B4F" />
        <Metric label="F1 score" value={pct(data.f1)} color="#0B2447" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PairList title="True positives" pairs={data.true_positives} color="#1E7B4F" />
        <PairList title="False positives" pairs={data.false_positives} color="#B3261E" />
        <PairList title="False negatives" pairs={data.false_negatives} color="#B7791F" />
      </div>

      <div className="bg-white border border-[#DDE3EE] rounded-lg p-4 text-sm">
        Deliberate look-alike pairs wrongly flagged:{' '}
        <strong>
          {data.negative_pairs_wrongly_flagged.length} of {data.negative_pairs_total}
        </strong>
      </div>

      <p className="text-xs text-slate-500">
        This is a small synthetic benchmark made by the team (4 true pairs, 1 look-alike pair). It checks the
        logic, not real-world accuracy.
      </p>
    </div>
  );
};