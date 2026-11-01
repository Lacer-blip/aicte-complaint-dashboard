import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth } from './guards';
import { LoginPage } from '../auth/LoginPage';
import { useSimDateStore } from '../store/simDate';
import { useSessionStore } from '../auth/session';
import { StudentGrievancesScreen } from '../features/studentGrievances';

const PlaceholderScreen: React.FC<{ title: string; note: string }> = ({ title, note }) => {
  const formattedDate = useSimDateStore((s) => s.formattedDate());
  const user = useSessionStore((s) => s.user);

  return (
    <div className="bg-white border border-[#DDE3EE] rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#DDE3EE] pb-4 mb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{note}</p>
        </div>
        <span className="text-xs bg-slate-100 border border-[#DDE3EE] px-3 py-1 rounded font-mono">
          Active Date: {formattedDate} | Role: {user?.role}
        </span>
      </div>
      <p className="text-sm text-slate-600">
        Foundation shell active. Full data and interactive controls for <strong>{title}</strong> will populate as we complete the upcoming modules.
      </p>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <PlaceholderScreen
            title="Role-Based Dashboard & Pendency Monitor"
            note="Real-time KPI tiles, SLA ageing buckets, workload bars, and breach risk advisory."
          />
        )
      },
      {
        path: 'applications',
        element: (
          <PlaceholderScreen
            title="Applications Workflow Register"
            note="End-to-end routing across Scrutiny, EVC, SAC, SHC, and Decision stages."
          />
        )
      },
      {
        path: 'evc',
        element: (
          <PlaceholderScreen
            title="Expert Visit Committee (EVC) Scheduling & Tracker"
            note="Queue management, conflict checks, visit calendar, and report verification."
          />
        )
      },
      {
        path: 'undertakings',
        element: (
          <PlaceholderScreen
            title="Time-Bound Undertakings & Compliance Tracker"
            note="Conditional approval monitoring, evidence uploads, and extension requests."
          />
        )
      },
      {
        path: 'documents',
        element: (
          <PlaceholderScreen
            title="Lease & Prescribed Document Validity Vault"
            note="90/60/30-day advance expiry tracking and renewal verification."
          />
        )
      },
      {
        path: 'student-grievances',
        element: <StudentGrievancesScreen />
      },
      {
        path: 'escalations',
        element: (
          <RequireAuth permission="REVIEW_ESCALATIONS">
            <PlaceholderScreen
              title="Multi-Tier Escalation Board (Level 1 / 2 / 3)"
              note="Overdue SLA escalations and competent authority advisory reviews."
            />
          </RequireAuth>
        )
      },
      {
        path: 'institutions',
        element: (
          <PlaceholderScreen
            title="Institution 360 Directory"
            note="Consolidated institutional compliance score, applications, and document history."
          />
        )
      },
      {
        path: 'reports',
        element: (
          <RequireAuth permission="VIEW_REPORTS">
            <PlaceholderScreen
              title="Consolidated Pendency & Compliance Reports"
              note="Exportable Excel (.xlsx), PDF, and CSV regional performance reports."
            />
          </RequireAuth>
        )
      },
      {
        path: 'leave',
        element: (
          <RequireAuth permission="MANAGE_LEAVE">
            <PlaceholderScreen
              title="My Leave & Automatic Delegation"
              note="Configure leave dates and automatic alert delegation to same-region peers."
            />
          </RequireAuth>
        )
      },
      {
        path: 'notifications',
        element: (
          <PlaceholderScreen
            title="Alert & Notification Center"
            note="Multi-channel (In-App, Email, SMS) delivery status, snooze, and acknowledgement."
          />
        )
      },
      {
        path: 'audit',
        element: (
          <RequireAuth permission="VIEW_AUDIT_LOG">
            <PlaceholderScreen
              title="Tamper-Evident SHA-256 Audit Trail"
              note="Hash-chained ledger of every workflow action and integrity verification."
            />
          </RequireAuth>
        )
      },
      {
        path: 'admin',
        element: (
          <RequireAuth permission="MANAGE_RULES">
            <PlaceholderScreen
              title="APH and SLA Rule Configuration (Admin Only)"
              note="System rules, holidays, user management, and access matrix (no application content)."
            />
          </RequireAuth>
        )
      },
      {
        path: 'system-health',
        element: (
          <RequireAuth permission="VIEW_SYSTEM_HEALTH">
            <PlaceholderScreen
              title="System Health & Adapter Status"
              note="Scheduler runs, notification delivery rates, and external adapter status."
            />
          </RequireAuth>
        )
      }
    ]
  }
]);