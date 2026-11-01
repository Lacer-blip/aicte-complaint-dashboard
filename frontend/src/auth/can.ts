import { Permission, Role } from '../api/types';
import { useSessionStore } from './session';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  INSTITUTION: [
    'SUBMIT_APPLICATION',
    'RESPOND_TO_RETURN',
    'UPLOAD_EVIDENCE',
    'REQUEST_EXTENSION',
    'VIEW_OWN_INSTITUTION'
  ],
  SCRUTINY_OFFICER: [
    'VIEW_REGION_DATA',
    'COMPLETE_STAGE',
    'RETURN_TO_INSTITUTION',
    'REVERT_STAGE',
    'GENERATE_LETTER',
    'MANAGE_LEAVE'
  ],
  REGIONAL_OFFICER: [
    'VIEW_REGION_DATA',
    'VERIFY_COMPLIANCE',
    'DECIDE_EXTENSION',
    'SEND_BULK_REMINDER',
    'REVIEW_ESCALATIONS',
    'GENERATE_LETTER',
    'VIEW_REPORTS',
    'MANAGE_LEAVE'
  ],
  REGIONAL_DIRECTOR: [
    'VIEW_REGION_DATA',
    'VERIFY_COMPLIANCE',
    'DECIDE_EXTENSION',
    'SEND_BULK_REMINDER',
    'REVIEW_ESCALATIONS',
    'REVERT_STAGE',
    'GENERATE_LETTER',
    'VIEW_REPORTS',
    'MANAGE_LEAVE'
  ],
  BUREAU_OFFICER: [
    'VIEW_ALL_REGIONS',
    'COMPLETE_STAGE',
    'SCHEDULE_EVC',
    'ACCEPT_EVC_REPORT',
    'RETURN_TO_INSTITUTION',
    'REVERT_STAGE',
    'SEND_BULK_REMINDER',
    'GENERATE_LETTER',
    'VIEW_REPORTS',
    'MANAGE_LEAVE'
  ],
  COMMITTEE_MEMBER: [
    'VIEW_ASSIGNED_ONLY',
    'SUBMIT_EVC_REPORT',
    'RECORD_RECOMMENDATION',
    'COMPLETE_STAGE',
    'MANAGE_LEAVE'
  ],
  BUREAU_HEAD: [
    'VIEW_ALL_REGIONS',
    'RECORD_FINAL_DECISION',
    'REVIEW_ESCALATIONS',
    'DECIDE_EXTENSION',
    'REVERT_STAGE',
    'GENERATE_LETTER',
    'VIEW_REPORTS',
    'VIEW_AUDIT_LOG',
    'VIEW_SYSTEM_HEALTH',
    'MANAGE_LEAVE'
  ],
  ADMIN: [
    'MANAGE_RULES',
    'MANAGE_USERS',
    'RUN_IMPORT',
    'VIEW_AUDIT_LOG',
    'VIEW_SYSTEM_HEALTH'
  ]
};

export function canRole(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function whoCan(permission: Permission): string {
  const roles = (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((r) =>
    ROLE_PERMISSIONS[r].includes(permission)
  );
  return `Permitted only for: ${roles.join(', ')}`;
}

export function useCan() {
  const user = useSessionStore((s) => s.user);
  return {
    can: (permission: Permission) => canRole(user?.role, permission),
    whoCan
  };
}