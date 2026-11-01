// src/store/grievancesStore.ts
import { create } from 'zustand';

export interface Grievance {
  id: string;
  studentName: string;
  enrollmentNo: string;
  institutionName: string;
  category: 'FEE_REFUND' | 'DOCUMENT_RETENTION' | 'INFRASTRUCTURE' | 'RAGGING' | 'ACADEMIC';
  description: string;
  raisedOn: string;
  dueOn: string;
  status: 'OPEN_SGRC' | 'ESCALATED_AICTE' | 'RESOLVED';
  daysLeft: number;
}

interface GrievanceState {
  grievances: Grievance[];
  addGrievance: (g: Grievance) => void;
  deleteGrievance: (id: string) => void;
}

export const useGrievanceStore = create<GrievanceState>((set) => ({
  grievances: [
    {
      id: 'SGRC-2026-001',
      studentName: 'Aman Verma',
      enrollmentNo: '0103CS229999',
      institutionName: 'Lakshmi Narain College of Technology (LNCT)',
      category: 'FEE_REFUND',
      description: 'Retention of caution money and tuition fee refund pending for 45 days after seat cancellation.',
      raisedOn: '2026-10-15',
      dueOn: '2026-10-30',
      status: 'ESCALATED_AICTE',
      daysLeft: -3
    }
  ],
  addGrievance: (g) => set((state) => ({ grievances: [g, ...state.grievances] })),
  deleteGrievance: (id) => set((state) => ({ grievances: state.grievances.filter(g => g.id !== id) }))
}));