import type { User } from './apiClient';

export const can = {
  editBaseline: (user: User) => ['doctor', 'admin'].includes(user.role),
  verifyDialysisSession: (user: User) => ['doctor', 'admin'].includes(user.role),
  invitePatient: (user: User) => ['doctor', 'hospital_admin', 'admin', 'platform_admin'].includes(user.role),
  grantBreakGlass: (user: User) => ['hospital_admin', 'doctor', 'assistant_doctor', 'nurse', 'dialysis_technician', 'pharmacist', 'records_officer', 'admin', 'platform_admin'].includes(user.role),
  reviewAudit: (user: User) => ['hospital_admin', 'admin', 'platform_admin'].includes(user.role),
};
