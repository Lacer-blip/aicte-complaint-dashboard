export type Role =
  | 'INSTITUTION'
  | 'SCRUTINY_OFFICER'
  | 'REGIONAL_OFFICER'
  | 'REGIONAL_DIRECTOR'
  | 'BUREAU_OFFICER'
  | 'COMMITTEE_MEMBER'
  | 'BUREAU_HEAD'
  | 'ADMIN';

export type Permission =
  | 'SUBMIT_APPLICATION'
  | 'RESPOND_TO_RETURN'
  | 'UPLOAD_EVIDENCE'
  | 'REQUEST_EXTENSION'
  | 'VIEW_OWN_INSTITUTION'
  | 'VIEW_REGION_DATA'
  | 'VIEW_ALL_REGIONS'
  | 'VIEW_ASSIGNED_ONLY'
  | 'COMPLETE_STAGE'
  | 'RETURN_TO_INSTITUTION'
  | 'REVERT_STAGE'
  | 'GENERATE_LETTER'
  | 'MANAGE_LEAVE'
  | 'VERIFY_COMPLIANCE'
  | 'DECIDE_EXTENSION'
  | 'SEND_BULK_REMINDER'
  | 'REVIEW_ESCALATIONS'
  | 'VIEW_REPORTS'
  | 'SCHEDULE_EVC'
  | 'ACCEPT_EVC_REPORT'
  | 'SUBMIT_EVC_REPORT'
  | 'RECORD_RECOMMENDATION'
  | 'RECORD_FINAL_DECISION'
  | 'VIEW_AUDIT_LOG'
  | 'VIEW_SYSTEM_HEALTH'
  | 'MANAGE_RULES'
  | 'MANAGE_USERS'
  | 'RUN_IMPORT';

export type StageCode = 'SCRUTINY' | 'EVC' | 'SAC' | 'SHC' | 'DECISION';
export type AppStatus =
  | 'IN_PROCESS'
  | 'RETURNED'
  | 'APPROVED'
  | 'APPROVED_WITH_UNDERTAKING'
  | 'REJECTED'
  | 'WITHDRAWN';
export type DeadlineState = 'ON_TRACK' | 'APPROACHING' | 'OVERDUE';

export interface Deadline {
  itemKey: string;
  kind: string;
  label: string;
  startOn: string;
  dueOn: string | null;
  daysLeft: number | null;
  state: DeadlineState;
  paused: boolean;
  escalationLevel: 0 | 1 | 2 | 3;
  overdueUnits: number;
  unit: 'WORKING_DAYS' | 'CALENDAR_DAYS';
  institutionOwned: boolean;
  recommendReview: boolean;
}

export interface Application {
  id: string;
  refNo: string;
  institutionId: string;
  institutionName: string;
  permanentId: string;
  regionCode: string;
  typeLabel: string;
  routeLabel: string;
  stagePlan: StageCode[];
  currentStage: StageCode;
  status: AppStatus;
  submittedOn: string;
  returnCount: number;
  ownerName: string;
  deadline: Deadline | null;
  officerDaysUsed: number;
  officerDaysAllowed: number | null;
  institutionDaysTotal: number;
  breachRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Undertaking {
  id: string;
  applicationRef: string;
  institutionName: string;
  conditionText: string;
  dueOn: string;
  originalDueOn: string;
  extensionCount: number;
  status: 'PENDING' | 'SUBMITTED' | 'VERIFIED';
  deadline: Deadline;
}

export interface DocumentRow {
  id: string;
  institutionName: string;
  typeLabel: string;
  title: string;
  validTo: string;
  status: 'VALID' | 'RENEWAL_SUBMITTED';
  band:
    | 'VALID'
    | 'EXPIRING_90'
    | 'EXPIRING_30'
    | 'EXPIRED'
    | 'RENEWAL_UNDER_VERIFICATION';
  daysLeft: number;
}

export interface EvcVisit {
  id: string;
  applicationRef: string;
  institutionName: string;
  isNewInstitution: boolean;
  status:
    | 'QUEUED'
    | 'SCHEDULED'
    | 'VISITED'
    | 'REPORT_RECEIVED'
    | 'ACCEPTED'
    | 'CANCELLED';
  queuedOn: string;
  scheduleDueOn: string;
  visitDate: string | null;
  reportDueOn: string | null;
  panel: { name: string; role: 'CHAIR' | 'MEMBER' }[];
  deadline: Deadline;
}

export interface AlertItem {
  id: string;
  title: string;
  body: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  milestone: string;
  createdOn: string;
  state: 'NEW' | 'READ' | 'ACKNOWLEDGED' | 'SNOOZED' | 'RESOLVED';
  viaDelegationOf?: string;
  deliveries: {
    channel: 'IN_APP' | 'EMAIL' | 'SMS';
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  }[];
}

export interface AuditEntry {
  seq: number;
  ts: string;
  actor: string;
  role: string;
  action: string;
  refType: string;
  refId: string;
  detail: string;
  reason?: string;
  hash: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  regionCode?: string;
  institutionId?: string;
}