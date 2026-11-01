import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, GitCompare, Building2, ScrollText, LogOut,BarChart3 } from 'lucide-react';
import { useSessionStore } from '../auth/session';
import { canRole } from '../auth/can';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Complaints', to: '/complaints', icon: FileText },
  { label: 'Overlaps', to: '/overlaps', icon: GitCompare },
  { label: 'Institutions', to: '/institutions', icon: Building2 },
  { label: 'Evaluation', to: '/evaluation', icon: BarChart3 },
  { label: 'Audit Log', to: '/audit', icon: ScrollText, permission: 'VIEW_AUDIT_LOG' }
];

export const Layout: React.FC = () => {
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA]">
      <header className="bg-[#0B2447] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-9 rounded-sm bg-gradient-to-b from-[#FF9933] via-white to-[#138808]" />
          <div>
            <div className="text-sm font-bold">AICTE Complaint Monitoring</div>
            <div className="text-[11px] text-blue-200">
              Integrated Institution Complaint Monitoring and Status Dashboard
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="bg-white/10 px-3 py-1 rounded">
            {user?.name} · <strong>{user?.role}</strong>
          </span>
          <button onClick={handleLogout} className="flex items-center gap-1 hover:underline">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-52 bg-white border-r border-[#DDE3EE] p-3 space-y-1">
          {NAV.filter((n) => !n.permission || canRole(user?.role, n.permission)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                  isActive ? 'bg-[#0B2447] text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>

      <footer className="text-center text-xs text-slate-500 py-3 border-t border-[#DDE3EE] bg-white">
        SIH Prototype · All data shown is synthetic demonstration data
      </footer>
    </div>
  );
};