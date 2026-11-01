import { useSessionStore } from './session';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  RB: ['DECIDE_OVERLAP'],
  PGRC: ['DECIDE_OVERLAP'],
  OTHER_BUREAU: ['DECIDE_OVERLAP'],
  REGIONAL: [],
  MANAGEMENT: ['VIEW_AUDIT_LOG'],
  ADMIN: ['DECIDE_OVERLAP', 'VIEW_AUDIT_LOG']
};

export function canRole(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function whoCan(permission: string): string {
  const roles = Object.keys(ROLE_PERMISSIONS).filter((r) =>
    ROLE_PERMISSIONS[r].includes(permission)
  );
  return `Permitted only for: ${roles.join(', ')}`;
}

export function useCan() {
  const user = useSessionStore((s) => s.user);
  return { can: (permission: string) => canRole(user?.role, permission), whoCan };
}