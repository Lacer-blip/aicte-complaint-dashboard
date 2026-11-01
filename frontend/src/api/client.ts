import {
  AlertItem,
  Application,
  AuditEntry,
  DocumentRow,
  EvcVisit,
  Role,
  Undertaking
} from './types';
import { DEMO_USERS } from '../auth/session';

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms));

export const apiClient = {
  async login(role: Role) {
    await delay(250);
    return DEMO_USERS[role];
  },
  async getDashboard(_simDate: string) {
    await delay(250);
    return {
      inProcess: 0,
      approaching: 0,
      overdue: 0,
      evcsDue: 0,
      undertakingsOverdue: 0,
      docsExpiring30: 0,
      complianceRate: 94
    };
  },
  async listApplications(_simDate: string, _filters?: Record<string, unknown>): Promise<Application[]> {
    await delay(250);
    return [];
  },
  async getApplication(_simDate: string, _id: string): Promise<Application | null> {
    await delay(250);
    return null;
  },
  async completeStage(_simDate: string, _id: string) {
    await delay(250);
    return { ok: true };
  },
  async returnToInstitution(_simDate: string, _id: string, _reason: string) {
    await delay(250);
    return { ok: true };
  },
  async resubmit(_simDate: string, _id: string) {
    await delay(250);
    return { ok: true };
  },
  async listEvc(_simDate: string): Promise<EvcVisit[]> {
    await delay(250);
    return [];
  },
  async scheduleEvc(_simDate: string, _payload: unknown) {
    await delay(250);
    return { ok: true };
  },
  async rescheduleEvc(_simDate: string, _id: string, _newDate: string, _reason: string) {
    await delay(250);
    return { ok: true };
  },
  async acceptEvcReport(_simDate: string, _id: string) {
    await delay(250);
    return { ok: true };
  },
  async listUndertakings(_simDate: string): Promise<Undertaking[]> {
    await delay(250);
    return [];
  },
  async submitEvidence(_simDate: string, _id: string, _fileHash: string) {
    await delay(250);
    return { ok: true };
  },
  async verifyCompliance(_simDate: string, _id: string, _approved: boolean, _reason?: string) {
    await delay(250);
    return { ok: true };
  },
  async requestExtension(_simDate: string, _id: string, _days: number, _reason: string) {
    await delay(250);
    return { ok: true };
  },
  async decideExtension(_simDate: string, _id: string, _approved: boolean, _reason: string) {
    await delay(250);
    return { ok: true };
  },
  async listDocuments(_simDate: string): Promise<DocumentRow[]> {
    await delay(250);
    return [];
  },
  async submitRenewal(_simDate: string, _id: string, _newValidTo: string) {
    await delay(250);
    return { ok: true };
  },
  async listEscalations(_simDate: string) {
    await delay(250);
    return [];
  },
  async listAlerts(_simDate: string): Promise<AlertItem[]> {
    await delay(250);
    return [];
  },
  async acknowledgeAlert(_simDate: string, _id: string) {
    await delay(200);
    return { ok: true };
  },
  async snoozeAlert(_simDate: string, _id: string, _until: string) {
    await delay(200);
    return { ok: true };
  },
  async resolveAlert(_simDate: string, _id: string) {
    await delay(200);
    return { ok: true };
  },
  async getReport(_simDate: string, _type: string, _filters?: unknown) {
    await delay(250);
    return { rows: [] };
  },
  async listAudit(_simDate: string): Promise<AuditEntry[]> {
    await delay(250);
    return [];
  },
  async verifyAuditChain() {
    await delay(250);
    return { ok: true, checked: 0 };
  },
  async getRules() {
    await delay(200);
    return {};
  },
  async updateRule(_key: string, _value: unknown, _reason: string) {
    await delay(250);
    return { ok: true };
  },
  async getSystemHealth() {
    await delay(200);
    return { status: 'HEALTHY' };
  },
  async publicTrack(_refNo: string) {
    await delay(250);
    return null;
  },
  async listInstitutions(_simDate: string, _query?: string) {
    await delay(250);
    return [];
  },
  async searchGlobal(_simDate: string, _query: string) {
    await delay(200);
    return { applications: [], institutions: [] };
  },
  async listLeave(_simDate: string) {
    await delay(200);
    return [];
  },
  async saveLeave(_simDate: string, _payload: unknown) {
    await delay(250);
    return { ok: true };
  },
  async recordFinalDecision(_simDate: string, _appId: string, _decision: string, _reason: string, _undertakings?: unknown[]) {
    await delay(250);
    return { ok: true };
  },
  async recordAuthorityReview(_simDate: string, _itemKey: string, _decision: string, _note: string) {
    await delay(250);
    return { ok: true };
  },
  async previewTemplate(_templateId: string) {
    await delay(200);
    return { inApp: '', email: '', sms: '' };
  },
  async resetDemoData() {
    await delay(250);
    return { ok: true };
  }
};