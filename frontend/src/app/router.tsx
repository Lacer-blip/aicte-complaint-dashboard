import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth } from './guards';
import { LoginPage } from '../auth/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ComplaintsPage } from '../pages/ComplaintsPage';
import { OverlapsPage } from '../pages/OverlapsPage';

const Soon: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-white border border-[#DDE3EE] rounded-lg p-6">
    <h1 className="text-lg font-bold text-[#0B2447]">{title}</h1>
    <p className="text-sm text-slate-500 mt-1">Coming in the next step.</p>
  </div>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'complaints', element: <ComplaintsPage /> },
      { path: 'overlaps', element: <OverlapsPage /> },
      { path: 'institutions', element: <Soon title="Institutions" /> },
      {
        path: 'audit',
        element: (
          <RequireAuth permission="VIEW_AUDIT_LOG">
            <Soon title="Audit Log" />
          </RequireAuth>
        )
      }
    ]
  }
]);