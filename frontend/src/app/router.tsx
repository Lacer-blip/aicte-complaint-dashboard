import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { RequireAuth } from './guards';
import { LoginPage } from '../auth/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ComplaintsPage } from '../pages/ComplaintsPage';
import { ComplaintDetailPage } from '../pages/ComplaintDetailPage';
import { OverlapsPage } from '../pages/OverlapsPage';
import { InstitutionsPage } from '../pages/InstitutionsPage';
import { InstitutionDetailPage } from '../pages/InstitutionDetailPage';
import { AuditPage } from '../pages/AuditPage';

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
      { path: 'complaints/:caseNumber', element: <ComplaintDetailPage /> },
      { path: 'overlaps', element: <OverlapsPage /> },
      { path: 'institutions', element: <InstitutionsPage /> },
      { path: 'institutions/:id', element: <InstitutionDetailPage /> },
      {
        path: 'audit',
        element: (
          <RequireAuth permission="VIEW_AUDIT_LOG">
            <AuditPage />
          </RequireAuth>
        )
      }
    ]
  }
]);