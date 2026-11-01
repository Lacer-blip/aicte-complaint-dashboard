import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useSessionStore } from '../auth/session';
import { canRole, whoCan } from '../auth/can';

export const RequireAuth: React.FC<{
  children: React.ReactNode;
  permission?: string;
}> = ({ children, permission }) => {
  const user = useSessionStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;

  if (permission && !canRole(user.role, permission)) {
    return (
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-8 max-w-lg mx-auto my-12 text-center">
        <ShieldAlert className="w-10 h-10 text-[#B3261E] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Denied</h2>
        <p className="text-sm text-slate-600 mb-3">
          Your role (<strong>{user.role}</strong>) cannot view this screen.
        </p>
        <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
          {whoCan(permission)}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};