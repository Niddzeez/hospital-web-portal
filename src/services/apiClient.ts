export type User = { id: string; name: string; email: string; role: string };
export type Hospital = { _id: string; name: string; code: string; status: string; address?: string; phone?: string };
export type PatientRelationship = { _id: string; mrn: string; patient?: { _id: string; name: string; email: string; phone?: string }; primaryDoctor?: { _id: string; name: string; email: string }; assistantDoctors?: Array<{ _id: string; name: string; email: string }>; careTeam?: Array<{ _id: string; name: string; email: string; role?: string }> };
export type InviteResult = { token: string; expiresAt: string; invitationId: string };
export type PatientHistory = { scope: 'summary' | 'detailed'; patient: { id: string; name: string; email: string; phone?: string }; relationship?: PatientRelationship & { hospital?: { name: string; code: string } }; profile: Record<string, unknown> | null; baselineAssessments: Array<Record<string, unknown>>; materialSessions: Array<Record<string, unknown>>; dialysisSessions: Array<Record<string, unknown>>; treatmentPlanVersions: Array<{ version: number; plan: Record<string, unknown>; createdAt?: string }>; activity?: Array<{ _id: string; action: string; occurredAt: string; actor?: { name: string; role: string } }> };
export type DialysisSessionRecord = { _id?: string; sessionId?: string; status?: string; sequence?: number; startedAt?: string; completedAt?: string; verifiedAt?: string; verifiedBy?: string; verifiedByName?: string; verificationNotes?: string | null; parameters?: Record<string, unknown>; voluntary?: Record<string, unknown> | null; readings?: { fillVolume?: number; drainVolume?: number; fillTime?: number; drainTime?: number } | null };
export type Membership = { _id: string; role: string; status: string; mrn?: string; user?: { _id?: string; name: string; email: string; role: string }; supervisingDoctor?: { name: string; email: string } };
export type AuditEvent = { _id: string; action: string; resourceType: string; occurredAt: string; actor?: { name: string; email: string; role: string }; hospital?: { name: string; code: string } };
export type PatientTransfer = { _id: string; status: 'pending_source' | 'pending_destination' | 'completed' | 'rejected'; reason: string; destinationMrn: string; patient?: { name: string; email: string }; fromHospital?: { _id: string; name: string; code: string }; toHospital?: { _id: string; name: string; code: string } };
export type Notification = { _id: string; type: string; title: string; message: string; readAt?: string | null; createdAt: string; actionUrl?: string };
export type PlatformOverview = { hospitals: number; activeUsers: number; activeMemberships: number };
export type BreakGlassAccess = { _id: string; reason: string; status: string; expiresAt: string; createdAt: string; actor?: { name: string; email: string; role: string }; patient?: { name: string; email: string } };
export type HospitalOverview = { activePatients: number; sessionsToday: number; pendingAssessments: number; careTeam: number };
export type HospitalOperations = { metrics: { activePatients: number; unassignedPatients: number; pendingAssessments: number; pendingVerification: number; riskPatients: number; followUpPatients: number }; unassignedPatients: Array<{ relationshipId: string; patient?: { _id: string; name: string; email: string }; primaryDoctor?: { name: string } }>; pendingAssessments: Array<{ relationshipId: string; patient?: { _id: string; name: string; email: string }; primaryDoctor?: { name: string } }>; pendingVerification: Array<{ patient?: { name: string; email: string }; sequence?: number; startedAt?: string }>; riskPatients: Array<{ patient?: { name: string; email: string }; startedAt?: string; voluntary?: { comments?: string } }>; followUpPatients: Array<{ relationshipId: string; patient?: { _id: string; name: string; email: string }; primaryDoctor?: { name: string }; reason: string }>; doctorWorkload: Array<{ doctor: { name: string; email: string }; patientCount: number }> };
export type DoctorWorklist = { assignedPatients: PatientRelationship[]; pendingVerification: number; riskPatients: Array<{ patient?: { name: string; email: string }; sequence?: number; startedAt?: string }>; followUpPatients: Array<{ patient?: { name: string; email: string }; reason: string }> };

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('dd_token');
  const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const api = {
  login: (email: string, password: string) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  acceptInvite: (token: string, password: string, phone: string) => request<{ token: string; user: User }>('/hospitals/invitations/accept', { method: 'POST', body: JSON.stringify({ token, password, phone }) }),
  hospitals: () => request<{ hospitals: Hospital[] }>('/hospitals'),
  createHospital: (payload: { name: string; code?: string; address?: string; phone?: string }) => request<{ hospital: Hospital }>('/hospitals', { method: 'POST', body: JSON.stringify(payload) }),
  updateHospitalStatus: (hospitalId: string, status: 'active' | 'suspended') => request<{ hospital: Hospital }>(`/hospitals/${hospitalId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateHospitalConfiguration: (hospitalId: string, payload: { name: string; address?: string; phone?: string }) => request<{ hospital: Hospital }>(`/hospitals/${hospitalId}/configuration`, { method: 'PATCH', body: JSON.stringify(payload) }),
  health: () => request<{ status: string; db: string }>('/health'),
  platformOverview: () => request<{ overview: PlatformOverview }>('/hospitals/platform/overview'),
  myHospitals: () => request<{ hospitals: Hospital[] }>('/hospitals/my'),
  hospitalDirectory: () => request<{ hospitals: Hospital[] }>('/hospitals/directory'),
  patients: (hospitalId: string) => request<{ relationships: PatientRelationship[] }>(`/hospitals/${hospitalId}/patient-relationships`),
  createPatient: (hospitalId: string, payload: Record<string, unknown>) => request<{ patient: { id: string; name: string; email: string | null; phone: string }; relationship: PatientRelationship; generatedEmail?: string; invitationToken?: string | null; invitationExpiresAt?: string | null }>(`/hospitals/${hospitalId}/patients`, { method: 'POST', body: JSON.stringify(payload) }),
  updatePatient: (hospitalId: string, patientId: string, payload: Record<string, unknown>) => request<{ patient: { name: string; email: string; phone?: string }; profile: Record<string, unknown> }>(`/hospitals/${hospitalId}/patients/${patientId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  overview: (hospitalId: string) => request<{ overview: HospitalOverview }>(`/hospitals/${hospitalId}/overview`),
  operations: (hospitalId: string) => request<{ operations: HospitalOperations }>(`/hospitals/${hospitalId}/operations`),
  doctorWorklist: (hospitalId: string) => request<{ worklist: DoctorWorklist }>(`/hospitals/${hospitalId}/doctor-worklist`),
  invite: (hospitalId: string, payload: { name: string; email: string; role: 'patient'; mrn: string }) => request<{ success: boolean } & InviteResult>(`/hospitals/${hospitalId}/invitations`, { method: 'POST', body: JSON.stringify(payload) }),
  inviteStaff: (hospitalId: string, payload: { name: string; email: string; role: 'hospital_admin' | 'doctor' | 'assistant_doctor' | 'nurse' | 'dialysis_technician' | 'pharmacist' | 'records_officer'; supervisingDoctor?: string }) => request<{ success: boolean } & InviteResult>(`/hospitals/${hospitalId}/invitations`, { method: 'POST', body: JSON.stringify(payload) }),
  history: (patientId: string, hospitalId: string) => request<PatientHistory>(`/patients/${patientId}/history?hospitalId=${encodeURIComponent(hospitalId)}`),
  grantConsent: (patientId: string, hospitalId: string, scope: 'summary' | 'detailed') => request('/consent', { method: 'POST', body: JSON.stringify({ patientId, hospitalId, scope }) }),
  revokeConsent: (patientId: string, hospitalId: string) => request('/consent/revoke', { method: 'POST', body: JSON.stringify({ patientId, hospitalId }) }),
  breakGlass: (patientId: string, hospitalId: string, reason: string, durationMinutes: number) => request('/break-glass', { method: 'POST', body: JSON.stringify({ patientId, hospitalId, reason, durationMinutes }) }),
  hospitalBreakGlass: (hospitalId: string) => request<{ accesses: BreakGlassAccess[] }>(`/break-glass/hospital?hospitalId=${encodeURIComponent(hospitalId)}`),
  updateBaseline: (payload: Record<string, unknown>) => request('/upload/doctor/baseline-assessment', { method: 'PATCH', body: JSON.stringify(payload) }),
  verifyDialysisSession: (sessionId: string, verificationNotes: string) => request('/upload/verify-dialysis-session', { method: 'PATCH', body: JSON.stringify({ sessionId, verificationNotes }) }),
  memberships: (hospitalId: string) => request<{ memberships: Membership[] }>(`/hospitals/${hospitalId}/memberships`),
  updateMembershipStatus: (hospitalId: string, membershipId: string, status: 'active' | 'suspended') => request<{ membership: Membership }>(`/hospitals/${hospitalId}/memberships/${membershipId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignPatient: (hospitalId: string, relationshipId: string, payload: { primaryDoctor?: string | null; assistantDoctorId?: string | null; assistantDoctorIds?: string[]; careTeamIds?: string[] }) => request<{ relationship: PatientRelationship }>(`/hospitals/${hospitalId}/patient-relationships/${relationshipId}/assignment`, { method: 'PATCH', body: JSON.stringify(payload) }),
  auditEvents: (hospitalId?: string, page = 1) => request<{ events: AuditEvent[]; pagination: { page: number; total: number; pages: number } }>(`/audit-events?${hospitalId ? `hospitalId=${encodeURIComponent(hospitalId)}&` : ''}page=${page}&limit=25`),
  transfers: (hospitalId: string) => request<{ transfers: PatientTransfer[] }>(`/transfers?hospitalId=${encodeURIComponent(hospitalId)}`),
  approveTransferSource: (transferId: string) => request(`/transfers/${transferId}/source-approve`, { method: 'PATCH' }),
  approveTransferDestination: (transferId: string) => request(`/transfers/${transferId}/destination-approve`, { method: 'PATCH' }),
  createTransfer: (payload: { patientId: string; fromHospitalId: string; toHospitalId: string; destinationMrn: string; reason: string }) => request<{ transfer: PatientTransfer }>('/transfers', { method: 'POST', body: JSON.stringify(payload) }),
  notifications: () => request<{ unread: number; notifications: Notification[] }>('/notifications'),
  readNotification: (notificationId: string) => request(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
};
