import React, { useState, useEffect } from 'react';
import { useSimDateStore } from '../store/simDate';
import { useSessionStore } from '../auth/session';
import { 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  Trash2, 
  Bell, 
  X, 
  Eye, 
  CheckCircle, 
  ArrowUpRight 
} from 'lucide-react';

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
  resolutionRemarks?: string;
}

export interface GrievanceNotification {
  id: string;
  title: string;
  message: string;
  target: 'STUDENT' | 'OFFICIAL' | 'INSTITUTION';
  enrollmentNo?: string;
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY_GRIEVANCES = 'aicte_sgrc_grievances_v1';
const STORAGE_KEY_NOTIFS = 'aicte_sgrc_notifs_v1';

const INITIAL_GRIEVANCES: Grievance[] = [
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
  },
  {
    id: 'SGRC-2026-002',
    studentName: 'Priya Sharma',
    enrollmentNo: '0103AI238888',
    institutionName: 'Technocrats Institute of Technology',
    category: 'DOCUMENT_RETENTION',
    description: 'Original 12th migration certificate and transfer certificate withheld by administrative office.',
    raisedOn: '2026-10-24',
    dueOn: '2026-11-08',
    status: 'OPEN_SGRC',
    daysLeft: 6
  }
];

export const StudentGrievancesScreen: React.FC = () => {
  const formattedDate = useSimDateStore((s) => s.formattedDate());
  const currentUser = useSessionStore((s) => s.user);

  // Determine exact user persona: Student vs College Institution vs AICTE Official
  const isStudent = Boolean(
    currentUser?.id?.startsWith('student-') || 
    currentUser?.name?.toLowerCase().includes('student') ||
    currentUser?.name?.match(/\(\d{4}[A-Z]{2}\d+\)/i)
  );
  const isInstitutionStaff = !isStudent && currentUser?.role === 'INSTITUTION';
  const isAicteOfficial = !isStudent && !isInstitutionStaff;

  // Extract Student Identity safely
  const rawName = currentUser?.name ? currentUser.name.replace(/\s*\([^)]*\)/, '').trim() : '';
  const matchEnrollment = currentUser?.name ? currentUser.name.match(/\(([^)]+)\)/) : null;
  const loggedInEnrollment = matchEnrollment 
    ? matchEnrollment[1] 
    : (currentUser?.id ? currentUser.id.replace('student-', '') : '0103CS221045');

  const studentNameMap: Record<string, string> = {
    '0103CS221045': 'Ravi Likhitkar',
    '0103CS221046': 'Durgesh',
    '0103AI221088': 'Aarav Sharma'
  };

  const loggedInName = (rawName && rawName !== 'Student' && !rawName.includes('Portal')) 
    ? rawName 
    : (studentNameMap[loggedInEnrollment.toUpperCase()] || 'Ravi Likhitkar');

  // Persistent Grievances State (Saved in localStorage so it never vanishes on tab/role switch)
  const [grievances, setGrievances] = useState<Grievance[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GRIEVANCES);
      return saved ? JSON.parse(saved) : INITIAL_GRIEVANCES;
    } catch {
      return INITIAL_GRIEVANCES;
    }
  });

  // Persistent Notifications State
  const [notifications, setNotifications] = useState<GrievanceNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync changes to localStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GRIEVANCES, JSON.stringify(grievances));
    } catch (e) {
      console.error('Failed to save grievances', e);
    }
  }, [grievances]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'TRACK'>('TRACK');
  const [selectedTicket, setSelectedTicket] = useState<Grievance | null>(null);
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  const [newGrievance, setNewGrievance] = useState({
    category: 'FEE_REFUND' as Grievance['category'],
    description: ''
  });

  // PRIVACY FILTER:
  // - Students ONLY see their own enrollment number's tickets.
  // - College Institution Staff & AICTE Officials see all tickets.
  const displayedGrievances = isStudent
    ? grievances.filter(g => g.enrollmentNo.trim().toUpperCase() === loggedInEnrollment.trim().toUpperCase())
    : grievances;

  // Filter notifications relevant to the current logged-in role
  const relevantNotifications = notifications.filter((n) => {
    if (isStudent) {
      return n.target === 'STUDENT' && n.enrollmentNo?.toUpperCase() === loggedInEnrollment.toUpperCase();
    }
    return n.target === 'OFFICIAL' || n.target === 'INSTITUTION';
  });

  const pushNotification = (notif: Omit<GrievanceNotification, 'id' | 'timestamp' | 'read'>) => {
    const newEntry: GrievanceNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications((prev) => [newEntry, ...prev]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrievance.description.trim()) return;

    const nextNum = grievances.length + 1;
    const newId = `SGRC-2026-00${nextNum}`;
    const categoryLabel = newGrievance.category.replace(/_/g, ' ');

    const created: Grievance = {
      id: newId,
      studentName: loggedInName,
      enrollmentNo: loggedInEnrollment,
      institutionName: 'Lakshmi Narain College of Technology (LNCT)',
      category: newGrievance.category,
      description: newGrievance.description,
      raisedOn: formattedDate || '02 Nov 2026',
      dueOn: '17 Nov 2026',
      status: 'OPEN_SGRC',
      daysLeft: 7
    };

    setGrievances((prev) => [created, ...prev]);
    setNewGrievance({ category: 'FEE_REFUND', description: '' });
    setActiveTab('TRACK');

    // 1. Create Notification for the Student
    const studentNotif: GrievanceNotification = {
      id: `notif-stu-${Date.now()}`,
      title: 'Issue Lodged Successfully',
      message: `Your grievance ${newId} (${categoryLabel}) has been registered. College SGRC has 7 working days to resolve it.`,
      target: 'STUDENT',
      enrollmentNo: loggedInEnrollment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    // 2. Create Notification for Officials & Institution
    const officialNotif: GrievanceNotification = {
      id: `notif-off-${Date.now() + 1}`,
      title: 'New Student Grievance Request Received',
      message: `Student ${loggedInName} (${loggedInEnrollment}) from LNCT lodged ticket ${newId} regarding ${categoryLabel}.`,
      target: 'OFFICIAL',
      enrollmentNo: loggedInEnrollment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications((prev) => [studentNotif, officialNotif, ...prev]);
    setToastBanner(`Ticket ${newId} lodged! Alerts dispatched to Student & AICTE Regional Officer.`);
    setTimeout(() => setToastBanner(null), 5000);
  };

  const handleDeleteGrievance = (id: string) => {
    if (window.confirm('Are you sure you want to withdraw and delete this grievance ticket?')) {
      setGrievances((prev) => prev.filter(g => g.id !== id));
      setToastBanner(`Grievance ticket ${id} withdrawn and removed.`);
      setTimeout(() => setToastBanner(null), 3500);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: Grievance['status'], remark: string) => {
    const target = grievances.find(g => g.id === id);
    if (!target) return;

    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, status: newStatus, resolutionRemarks: remark, daysLeft: newStatus === 'RESOLVED' ? 0 : g.daysLeft }
          : g
      )
    );

    // Notify the Student about Official/Institution Action
    pushNotification({
      title: newStatus === 'RESOLVED' ? `Grievance ${id} Resolved` : `Grievance ${id} Escalated to AICTE`,
      message: remark,
      target: 'STUDENT',
      enrollmentNo: target.enrollmentNo
    });

    setSelectedTicket(null);
    setToastBanner(`Ticket ${id} updated to ${newStatus.replace(/_/g, ' ')}. Student notified.`);
    setTimeout(() => setToastBanner(null), 4000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Live Pop-Up Toast Banner */}
      {toastBanner && (
        <div className="bg-[#0B2447] text-white px-4 py-3 rounded-lg shadow-lg border-l-4 border-[#F5A623] flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#F5A623] shrink-0" />
            <span className="font-bold">{toastBanner}</span>
          </div>
          <button onClick={() => setToastBanner(null)} className="text-slate-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Role-Specific Live Notification Feed (Pops up for Students AND Officials) */}
      {relevantNotifications.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
              <Bell className="w-4 h-4 text-[#F5A623]" />
              {isStudent ? 'My Grievance Alerts & Updates' : 'Official SGRC Incoming Student Requests'} ({relevantNotifications.length})
            </div>
            <button
              onClick={() => setNotifications([])}
              className="text-[11px] font-semibold text-amber-900 hover:underline"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {relevantNotifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white border border-amber-200 rounded p-2.5 flex items-start justify-between gap-3 text-xs shadow-sm"
              >
                <div>
                  <div className="font-bold text-[#0B2447] flex items-center gap-2">
                    <span>{notif.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{notif.message}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main SGRC Card */}
      <div className="bg-white border border-[#DDE3EE] rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDE3EE] pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#0B2447]">Student Grievance & Redressal Module (SGRC)</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-[#EBF3FA] text-[#1B3A6B] border border-[#B8D4EE]">
                {isStudent ? `Student View: ${loggedInName}` : isInstitutionStaff ? 'Institution SGRC Desk' : 'AICTE Official Oversight'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              AICTE Mandated 7-Day College SGRC Resolution SLA & Regional Officer Escalation Pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('TRACK')}
              className={`px-4 py-2 text-xs font-bold rounded transition-colors ${
                activeTab === 'TRACK' ? 'bg-[#0B2447] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isStudent ? `My Grievances (${displayedGrievances.length})` : `All Institution Tickets (${displayedGrievances.length})`}
            </button>
            {isStudent && (
              <button
                onClick={() => setActiveTab('REGISTER')}
                className={`px-4 py-2 text-xs font-bold rounded transition-colors ${
                  activeTab === 'REGISTER' ? 'bg-[#F5A623] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                + File New Grievance
              </button>
            )}
          </div>
        </div>

        {activeTab === 'TRACK' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#EBF3FA] border border-[#B8D4EE] p-4 rounded-lg">
                <div className="text-xs font-bold text-[#0B2447] uppercase">
                  {isStudent ? 'My Filed Cases' : 'Total Active Cases'}
                </div>
                <div className="text-2xl font-extrabold text-[#0B2447] mt-1">{displayedGrievances.length}</div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {isStudent ? 'Strictly confidential to your ID' : 'Linked to Annual EoA compliance'}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="text-xs font-bold text-amber-900 uppercase">Internal SGRC Open</div>
                <div className="text-2xl font-extrabold text-amber-700 mt-1">
                  {displayedGrievances.filter(g => g.status === 'OPEN_SGRC').length}
                </div>
                <div className="text-[11px] text-amber-800 mt-1">7-day college resolution window</div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="text-xs font-bold text-red-900 uppercase">Escalated to AICTE Regional</div>
                <div className="text-2xl font-extrabold text-[#B3261E] mt-1">
                  {displayedGrievances.filter(g => g.status === 'ESCALATED_AICTE').length}
                </div>
                <div className="text-[11px] text-red-800 mt-1">Breached SLA / Ombudsman review</div>
              </div>
            </div>

            {displayedGrievances.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
                You have not filed any grievances yet. Click{' '}
                <button
                  onClick={() => setActiveTab('REGISTER')}
                  className="font-bold text-[#0B2447] underline hover:text-[#F5A623]"
                >
                  "+ File New Grievance"
                </button>{' '}
                to raise a confidential ticket.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B2447] text-white">
                    <tr>
                      <th className="p-3">Grievance ID</th>
                      <th className="p-3">Student & Enrollment</th>
                      <th className="p-3">Institution</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status / SLA</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayedGrievances.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-[#0B2447]">{item.id}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{item.enrollmentNo}</div>
                        </td>
                        <td className="p-3 text-slate-700">{item.institutionName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-semibold text-slate-700">
                            {item.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.status === 'ESCALATED_AICTE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-[#B3261E] rounded-full font-bold text-[11px]">
                              <ShieldAlert className="w-3 h-3" /> Escalated to AICTE
                            </span>
                          ) : item.status === 'RESOLVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                              <CheckCircle className="w-3 h-3" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                              <Clock className="w-3 h-3" /> SGRC Open ({item.daysLeft}d left)
                            </span>
                          )}
                        </td>
                        <td className="p-3 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTicket(item)}
                            className="px-3 py-1 bg-[#1B3A6B] hover:bg-[#0B2447] text-white rounded font-medium text-xs shadow-sm flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> View Details
                          </button>
                          {isStudent && (
                            <button
                              onClick={() => handleDeleteGrievance(item.id)}
                              title="Withdraw / Delete Grievance"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-[#B3261E] rounded border border-red-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-900">
              Students can lodge complaints directly. Per AICTE norms, colleges have 7 working days to resolve before automatic regional escalation.
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Full Student Name (Auto-Filled)</label>
              <input
                type="text"
                disabled
                value={loggedInName}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Enrollment / Permanent ID (Auto-Filled)</label>
              <input
                type="text"
                disabled
                value={loggedInEnrollment}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs bg-slate-100 text-slate-700 font-mono font-semibold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Grievance Category</label>
              <select
                value={newGrievance.category}
                onChange={(e) => setNewGrievance({ ...newGrievance, category: e.target.value as Grievance['category'] })}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs bg-white"
              >
                <option value="FEE_REFUND">Fee Refund & Caution Money Retention</option>
                <option value="DOCUMENT_RETENTION">Original Document Withholding (Marksheets/TC)</option>
                <option value="INFRASTRUCTURE">Infrastructure & Lab Deficiencies</option>
                <option value="RAGGING">Ragging / Harassment (Direct Ombudsman Flag)</option>
                <option value="ACADEMIC">Unapproved Faculty / Academic Malpractice</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Detailed Description</label>
              <textarea
                required
                rows={4}
                value={newGrievance.description}
                onChange={(e) => setNewGrievance({ ...newGrievance, description: e.target.value })}
                placeholder="Provide dates, receipts, or specific details of your grievance..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-[#F5A623] hover:bg-[#E09112] text-white font-bold px-6 py-2.5 rounded-full text-xs uppercase tracking-wider shadow-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Grievance to AICTE Portal
            </button>
          </form>
        )}
      </div>

      {/* Ticket Inspection & Official Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#0B2447] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-300">{selectedTicket.id}</span>
                <h3 className="text-sm font-bold">Grievance Case Record</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Student</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedTicket.studentName}</div>
                  <div className="font-mono text-[11px] text-slate-600">{selectedTicket.enrollmentNo}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Institution</div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedTicket.institutionName}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Complaint Description</div>
                <div className="p-3 rounded bg-[#EBF3FA] border border-[#B8D4EE] text-slate-800 leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.resolutionRemarks && (
                <div>
                  <div className="text-[10px] text-emerald-700 uppercase font-bold mb-1">Official Resolution / Remarks</div>
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                    {selectedTicket.resolutionRemarks}
                  </div>
                </div>
              )}

              {/* Action Controls for Officials & Institution Staff */}
              {!isStudent && selectedTicket.status !== 'RESOLVED' && (
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        selectedTicket.id,
                        'RESOLVED',
                        'Resolved by SGRC / Regional Officer after verification of compliance records.'
                      )
                    }
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                  {selectedTicket.status !== 'ESCALATED_AICTE' && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedTicket.id,
                          'ESCALATED_AICTE',
                          'Escalated to AICTE Regional Ombudsman due to 7-day college SLA breach.'
                        )
                      }
                      className="px-3.5 py-1.5 bg-[#B3261E] hover:bg-red-800 text-white font-bold rounded flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Escalate to AICTE
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};