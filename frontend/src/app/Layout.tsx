import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../auth/session';
import { useSimDateStore } from '../store/simDate';
import { Role } from '../api/types';
import {
  Bell,
  Calendar,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Search,
  ShieldAlert,
  Sliders,
  Users,
  ClipboardCheck,
  Building2,
  BarChart3,
  CalendarOff,
  Activity
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: [
      'INSTITUTION',
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'COMMITTEE_MEMBER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Applications',
    to: '/applications',
    icon: <FolderKanban className="w-4 h-4" />,
    roles: [
      'INSTITUTION',
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'EVC Visits',
    to: '/evc',
    icon: <ClipboardCheck className="w-4 h-4" />,
    roles: [
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'COMMITTEE_MEMBER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Undertakings',
    to: '/undertakings',
    icon: <FileText className="w-4 h-4" />,
    roles: [
      'INSTITUTION',
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Documents & Leases',
    to: '/documents',
    icon: <FileText className="w-4 h-4" />,
    roles: [
      'INSTITUTION',
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Student Grievances',
    to: '/student-grievances',
    icon: <ShieldAlert className="w-4 h-4" />,
    roles: [
      'INSTITUTION',
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Escalations',
    to: '/escalations',
    icon: <ShieldAlert className="w-4 h-4" />,
    roles: ['REGIONAL_OFFICER', 'REGIONAL_DIRECTOR', 'BUREAU_OFFICER', 'BUREAU_HEAD']
  },
  {
    label: 'Institutions',
    to: '/institutions',
    icon: <Building2 className="w-4 h-4" />,
    roles: [
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Reports',
    to: '/reports',
    icon: <BarChart3 className="w-4 h-4" />,
    roles: ['REGIONAL_OFFICER', 'REGIONAL_DIRECTOR', 'BUREAU_OFFICER', 'BUREAU_HEAD']
  },
  {
    label: 'My Leave',
    to: '/leave',
    icon: <CalendarOff className="w-4 h-4" />,
    roles: [
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'COMMITTEE_MEMBER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: <Bell className="w-4 h-4" />,
    roles: [
      'INSTITUTION',
      'SCRUTINY_OFFICER',
      'REGIONAL_OFFICER',
      'REGIONAL_DIRECTOR',
      'BUREAU_OFFICER',
      'COMMITTEE_MEMBER',
      'BUREAU_HEAD'
    ]
  },
  {
    label: 'Admin & Rules',
    to: '/admin',
    icon: <Sliders className="w-4 h-4" />,
    roles: ['ADMIN']
  },
  {
    label: 'Audit Log',
    to: '/audit',
    icon: <Users className="w-4 h-4" />,
    roles: ['BUREAU_HEAD', 'ADMIN']
  },
  {
    label: 'System Health',
    to: '/system-health',
    icon: <Activity className="w-4 h-4" />,
    roles: ['BUREAU_HEAD', 'ADMIN']
  }
];

export const Layout: React.FC = () => {
  const { user, logout } = useSessionStore();
  const {
    simDate,
    setSimDate,
    advanceDays,
    resetSimDate,
    isSimulated,
    formattedDate
  } = useSimDateStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA]">
      {/* Simulated Date Warning Ribbon */}
      {isSimulated() && (
        <div className="bg-[#B7791F] text-white text-xs font-semibold py-1.5 px-6 flex items-center justify-between">
          <span>
            Simulated date: {formattedDate()} — Deadlines, SLA clocks, and escalations are computed against this date.
          </span>
          <button
            onClick={resetSimDate}
            className="underline hover:no-underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Real Date
          </button>
        </div>
      )}

      {/* White Statutory Top Band (No Logo, Bilingual Title) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-9 rounded-sm bg-gradient-to-b from-[#FF9933] via-white to-[#138808] border border-slate-300 shrink-0" />
          <div>
            <div className="text-[11px] font-bold text-slate-600 leading-tight">
              तकनीकी शिक्षा अनुमोदन एवं अनुपालन निगरानी प्रणाली
            </div>
            <div className="text-sm font-extrabold text-[#0B2447] tracking-tight">
              Approval & Compliance Monitor — Approval Process 2026-2027
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right hidden sm:block">
            <div className="font-bold text-[#0B2447]">{user.name}</div>
            <div className="text-[11px] text-[#B7791F] font-mono font-semibold">
              {user.role} {user.regionCode ? `(${user.regionCode} Region)` : ''}
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#F5A623] hover:bg-[#E09112] text-white font-bold px-3.5 py-1 rounded-full text-xs shadow-sm transition-colors"
          >
            Switch Role
          </button>
        </div>
      </div>

      {/* Deep Navy Navigation & Simulated Date Control Bar */}
      <header className="h-14 bg-[#0B2447] text-white px-6 flex items-center justify-between border-b border-[#1B3A6B] shrink-0">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-white/10 rounded-full px-3.5 py-1 text-xs w-72 border border-white/15">
            <Search className="w-3.5 h-3.5 mr-2 text-amber-300" />
            <input
              type="text"
              aria-label="Global search"
              placeholder="Search Reference No, Permanent ID, Institution..."
              className="bg-transparent border-none outline-none text-white placeholder:text-slate-300 w-full"
            />
          </div>
        </div>

        {/* Simulated Date Controls with Amber Pill Buttons */}
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs border border-white/15">
          <Calendar className="w-3.5 h-3.5 text-[#F5A623]" />
          <span className="font-semibold mr-1">Sim Date: {formattedDate()}</span>
          <input
            type="date"
            aria-label="Simulated date picker"
            value={simDate}
            onChange={(e) => setSimDate(e.target.value)}
            className="bg-[#1B3A6B] text-white px-2 py-0.5 rounded text-xs border border-slate-500"
          />
          <button
            onClick={() => advanceDays(1)}
            className="px-2.5 py-0.5 bg-[#F5A623] hover:bg-[#E09112] text-white rounded-full font-bold"
          >
            +1d
          </button>
          <button
            onClick={() => advanceDays(7)}
            className="px-2.5 py-0.5 bg-[#F5A623] hover:bg-[#E09112] text-white rounded-full font-bold"
          >
            +7d
          </button>
          <button
            onClick={() => advanceDays(30)}
            className="px-2.5 py-0.5 bg-[#F5A623] hover:bg-[#E09112] text-white rounded-full font-bold"
          >
            +30d
          </button>
          <button
            onClick={resetSimDate}
            className="px-2.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-1.5 hover:bg-white/10 rounded-full"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-amber-300" />
            <span className="absolute -top-0.5 -right-0.5 bg-[#B3261E] text-white text-[10px] px-1 rounded-full font-bold">
              3
            </span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area with Left Sidebar (240px) */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-16 md:w-60 bg-white border-r border-[#DDE3EE] shrink-0 flex flex-col justify-between py-4 shadow-sm">
          <nav className="space-y-1 px-2.5">
            {visibleNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#0B2447] text-white shadow-sm border-l-4 border-[#F5A623]'
                      : 'text-slate-700 hover:bg-[#EBF3FA] hover:text-[#0B2447]'
                  }`
                }
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-4 hidden md:block">
            <div className="p-3 rounded-lg bg-[#EBF3FA] border border-[#B8D4EE] text-[11px] text-[#0B2447]">
              <div className="font-bold mb-0.5">Approval Process 2026-27</div>
              <div className="opacity-80">Human oversight enforced on SAC, SHC & Final Decisions.</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#E3EFFA]/60 to-[#F4F6FA] p-6">
          <div className="max-w-[1440px] mx-auto w-full">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-4 bg-white px-4 py-2 rounded border border-[#DDE3EE]">
              <div>
                Portal / <span className="text-[#0B2447] font-bold capitalize">{location.pathname.slice(1) || 'dashboard'}</span>
              </div>
              <span className="text-[11px] text-[#1B3A6B] font-semibold">
                Regulatory Safeguard: Decisions rest with the competent authority
              </span>
            </div>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mandatory Synthetic Data Footer Strip */}
      <footer className="bg-[#0B2447] text-slate-200 border-t border-slate-700 py-2.5 px-6 text-center text-xs shrink-0">
        Prototype with synthetic data. Alerts support, and do not replace, decisions of the competent authority.
      </footer>
    </div>
  );
};