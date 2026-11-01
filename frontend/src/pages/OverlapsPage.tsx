import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/http';
import { useCan } from '../auth/can';
import { exportPdf, exportXlsx } from '../utils/exportUtils';

interface Overlap {
  case_1: string;
  case_2: string;
  institution_1: string;
  institution_2: string;
  bureau_1: string;
  bureau_2: string;
  confidence: string;
  institution_similarity: number;
  subject_similarity: number;
  signals: string[];
  explanation: string;
}

interface AuditItem {
  action: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  created_at: string | null;
}

type Action = 'CONFIRM_LINK' | 'DISMISS' | 'REQUEST_COORDINATION';

const ACTION_LABEL: Record<string, string> = {
  CONFIRM_LINK: 'Link confirmed',
  DISMISS: 'Dismissed',
  REQUEST_COORDINATION: 'Coordination requested'
};

const ACTION_STYLE: Record<string, string> = {
  CONFIRM_LINK: 'bg-green-100 text-[#1E7B4F]',
  DISMISS: 'bg-slate-200 text-slate-700',
  REQUEST_COORDINATION: 'bg-amber-100 text-[#B7791F]'
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

const OverlapCard: React.FC<{
  item: Overlap;
  decision?: AuditItem;
  canDecide: boolean;
}> = ({ item, decision, canDecide }) => {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (action: Action) =>
      apiFetch('/api/overlaps/decision', {
        method: 'POST',
        body: JSON.stringify({
          case_number_1: item.case_1,
          case_number_2: item.case_2,
          action,
          reason: reason.trim()
        })
      }),
    onSuccess: () => {
      setPending(null);
      setReason('');
      setError('');
      queryClient.invalidateQueries({ queryKey: ['overlap-decisions'] });
    },
    onError: (e: Error) => setError(e.message)
  });

  const submit = () => {
    if (!pending) return;
    if (pending === 'DISMISS' && !reason.trim()) {
      setError('A reason is required to dismiss an overlap.');
      return;
    }
    mutation.mutate(pending);
  };

  return (
    <div className="bg-white border border-[#DDE3EE] rounded-lg p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-bold text-[#0B2447]">
          <span className="font-mono">{item.case_1}</span>
          <span className="mx-2 text-slate-400">↔</span>
          <span className="font-mono">{item.case_2}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {decision && (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_STYLE[decision.action] ?? ''}`}>
              {ACTION_LABEL[decision.action] ?? decision.action} by {decision.actor}
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-[#1B3A6B]">
            {item.confidence}
          </span>
          {item.subject_similarity < 0.4 && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-[#B7791F]">
              Weak subject match
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-50 rounded p-3">
          <div className="text-[11px] uppercase font-bold text-slate-500">{item.bureau_1}</div>
          <div>{item.institution_1}</div>
        </div>
        <div className="bg-slate-50 rounded p-3">
          <div className="text-[11px] uppercase font-bold text-slate-500">{item.bureau_2}</div>
          <div>{item.institution_2}</div>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-600">
        <span>
          Institution similarity: <strong>{pct(item.institution_similarity)}</strong>
        </span>
        <span>
          Subject similarity: <strong>{pct(item.subject_similarity)}</strong>
        </span>
      </div>

      <ul className="text-xs text-slate-700 list-disc pl-5 space-y-0.5">
        {item.signals.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">{item.explanation}</p>

      {canDecide ? (
        <div className="border-t border-[#DDE3EE] pt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPending('CONFIRM_LINK')}
              className="text-xs font-bold bg-[#1E7B4F] text-white rounded px-3 py-1.5"
            >
              Confirm link
            </button>
            <button
              onClick={() => setPending('REQUEST_COORDINATION')}
              className="text-xs font-bold bg-[#B7791F] text-white rounded px-3 py-1.5"
            >
              Request coordination
            </button>
            <button
              onClick={() => setPending('DISMISS')}
              className="text-xs font-bold bg-slate-600 text-white rounded px-3 py-1.5"
            >
              Dismiss
            </button>
          </div>

          {pending && (
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={pending === 'DISMISS' ? 'Reason (required)' : 'Note (optional)'}
                className="w-full border border-[#DDE3EE] rounded px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={mutation.isPending}
                  className="text-xs font-bold bg-[#0B2447] text-white rounded px-3 py-1.5 disabled:opacity-60"
                >
                  {mutation.isPending ? 'Saving...' : `Submit: ${ACTION_LABEL[pending]}`}
                </button>
                <button
                  onClick={() => {
                    setPending(null);
                    setError('');
                  }}
                  className="text-xs font-bold bg-slate-100 rounded px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-[#B3261E] bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-[#DDE3EE] pt-3 text-xs text-slate-500">
          Your role can view overlaps but cannot record review decisions.
        </div>
      )}
    </div>
  );
};

export const OverlapsPage: React.FC = () => {
  const { can } = useCan();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL');

  const overlaps = useQuery({
    queryKey: ['overlaps'],
    queryFn: () => apiFetch<{ items: Overlap[] }>('/api/overlaps')
  });

  const audit = useQuery({
    queryKey: ['overlap-decisions'],
    queryFn: () => apiFetch<{ items: AuditItem[] }>('/api/audit'),
    staleTime: 0
  });

  if (overlaps.isLoading) return <p className="text-sm text-slate-600">Loading overlaps...</p>;
  if (overlaps.error || !overlaps.data)
    return <p className="text-sm text-[#B3261E]">Could not load overlaps.</p>;

  // Latest decision per pair (audit list is newest first).
  const latest = new Map<string, AuditItem>();
  for (const a of audit.data?.items ?? []) {
    if (a.entity_type === 'overlap' && !latest.has(a.entity_id)) {
      latest.set(a.entity_id, a);
    }
  }

  const keyOf = (o: Overlap) => `${o.case_1}|${o.case_2}`;

  const items = overlaps.data.items
    .filter((o) => {
      const reviewed = latest.has(keyOf(o));
      return filter === 'ALL' || (filter === 'REVIEWED' ? reviewed : !reviewed);
    })
    .sort((a, b) => b.subject_similarity - a.subject_similarity);

  const exportRows = items.map((o) => ({
    'Case 1': o.case_1,
    'Case 2': o.case_2,
    'Institution 1': o.institution_1,
    'Institution 2': o.institution_2,
    'Bureau 1': o.bureau_1,
    'Bureau 2': o.bureau_2,
    Confidence: o.confidence,
    'Institution similarity': pct(o.institution_similarity),
    'Subject similarity': pct(o.subject_similarity),
    'Latest decision': latest.get(keyOf(o))?.action ?? 'Pending'
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0B2447]">Potential Overlaps ({items.length})</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Suggestions only. An officer must review each pair. Nothing is merged automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border border-[#DDE3EE] rounded px-2 py-1.5 text-sm"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending review</option>
            <option value="REVIEWED">Reviewed</option>
          </select>
          <button
            onClick={() => exportXlsx(exportRows, 'overlaps', 'Overlaps')}
            className="text-xs font-bold bg-[#1E7B4F] text-white rounded px-3 py-1.5"
          >
            Excel
          </button>
          <button
            onClick={() => exportPdf('Potential overlaps report', exportRows, 'overlaps')}
            className="text-xs font-bold bg-[#0B2447] text-white rounded px-3 py-1.5"
          >
            PDF
          </button>
        </div>
      </div>

      {items.map((o) => (
        <OverlapCard
          key={keyOf(o)}
          item={o}
          decision={latest.get(keyOf(o))}
          canDecide={can('DECIDE_OVERLAP')}
        />
      ))}
    </div>
  );
};