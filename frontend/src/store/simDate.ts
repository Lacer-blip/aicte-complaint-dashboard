import { create } from 'zustand';
import { addDays, format } from 'date-fns';

const REAL_TODAY = '2026-11-02'; // Anchor baseline date for deterministic demo

interface SimDateState {
  simDate: string; // ISO YYYY-MM-DD
  realDate: string;
  setSimDate: (date: string) => void;
  advanceDays: (days: number) => void;
  resetSimDate: () => void;
  isSimulated: () => boolean;
  formattedDate: () => string;
}

export const useSimDateStore = create<SimDateState>((set, get) => ({
  simDate: REAL_TODAY,
  realDate: REAL_TODAY,
  setSimDate: (date: string) => set({ simDate: date }),
  advanceDays: (days: number) => {
    const next = addDays(new Date(get().simDate), days);
    set({ simDate: format(next, 'yyyy-MM-dd') });
  },
  resetSimDate: () => set({ simDate: REAL_TODAY }),
  isSimulated: () => get().simDate !== get().realDate,
  formattedDate: () => format(new Date(get().simDate), 'dd MMM yyyy')
}));