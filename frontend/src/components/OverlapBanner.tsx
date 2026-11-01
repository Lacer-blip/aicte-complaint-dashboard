import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api/http';

interface OverlapRef {
  case_1: string;
  case_2: string;
  institution_id_1: number;
  institution_id_2: number;
}

export const OverlapBanner: React.FC<{ caseNumber?: string; institutionId?: number }> = ({
  caseNumber,
  institutionId
}) => {
  const { data } = useQuery({
    queryKey: ['overlaps'],
    queryFn: () => apiFetch<{ items: OverlapRef[] }>('/api/overlaps')
  });

  const matches = (data?.items ?? []).filter((o) => {
    if (caseNumber) return o.case_1 === caseNumber || o.case_2 === caseNumber;
    if (institutionId !== undefined)
      return o.institution_id_1 === institutionId || o.institution_id_2 === institutionId;
    return false;
  });

  if (matches.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-[#B7791F] shrink-0 mt-0.5" />
      <div className="text-sm">
        <div className="font-bold text-[#7A5410]">Potential Overlapping Cases: Coordination Required</div>
        <p className="text-slate-700 mt-0.5">
          {matches.length} possible overlap{matches.length > 1 ? 's' : ''} with cases in other bureaus.{' '}
          <Link to="/overlaps" className="text-[#1B3A6B] font-bold hover:underline">
            Review in Overlaps
          </Link>
        </p>
        {caseNumber && (
          <p className="text-xs text-slate-600 mt-1">
            Related:{' '}
            {matches.slice(0, 4).map((o) => {
              const other = o.case_1 === caseNumber ? o.case_2 : o.case_1;
              return (
                <Link
                  key={other}
                  to={`/complaints/${other}`}
                  className="font-mono text-[#1B3A6B] hover:underline mr-2"
                >
                  {other}
                </Link>
              );
            })}
          </p>
        )}
      </div>
    </div>
  );
};