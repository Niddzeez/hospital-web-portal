import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  FileText,
  HeartPulse,
  History,
  Pencil,
  ShieldCheck,
  Siren,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  api,
  type Hospital,
  type PatientHistory,
  type PatientRelationship,
  type User,
} from "../services/apiClient";
import { can } from "../services/permissions";
import { DialysisSessionList } from "../components/DialysisSessionList";
import { TreatmentPlanCard } from "../components/TreatmentPlanCard";

type Tab = "overview" | "identity" | "clinical" | "activity";
const label = (value: string) =>
  value.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const isPlaceholderEmail = (value?: string) =>
  !value || value.endsWith("@no-email.local");

export function PatientProfilePage({
  relationship,
  hospital,
  user,
  onBack,
}: {
  relationship: PatientRelationship;
  hospital: Hospital;
  user: User;
  onBack: () => void;
}) {
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const patient = relationship.patient;
  const canEditDetails = ["hospital_admin", "admin", "platform_admin"].includes(
    user.role,
  );
  const canEditAssessment = can.editBaseline(user);
  const canEmergency = can.grantBreakGlass(user);
  const canVerify = can.verifyDialysisSession(user);
  const reload = () => {
    if (patient)
      api
        .history(patient._id, hospital._id)
        .then(setHistory)
        .catch((err) =>
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load patient record",
          ),
        );
  };
  useEffect(reload, [patient?._id, hospital._id]);
  const saveDetails = async (payload: Record<string, unknown>) => {
    if (!patient) return;
    await api.updatePatient(hospital._id, patient._id, payload);
    setDetailsOpen(false);
    setMessage("Patient record updated.");
    reload();
  };
  const verifySession = async (
    session: { _id?: string; sessionId?: string },
    notes: string,
  ) => {
    const id = session._id || session.sessionId;
    if (!id) throw new Error("Session identifier is missing");
    try {
      await api.verifyDialysisSession(id, notes);
      setMessage("Dialysis session verified.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify session");
      throw err;
    }
  };
  const currentRelationship = history?.relationship || relationship;
  return (
    <div>
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={16} /> Back to patients
      </button>
      <header className="patient-header patient-chart-header">
        <div className="patient-large-avatar">
          {patient?.name?.slice(0, 1) || "P"}
        </div>
        <div>
          <p className="eyebrow">
            Patient chart · {relationship.mrn || "No MRN"}
          </p>
          <h1>{history?.patient.name || patient?.name || "Patient"}</h1>
          <p className="muted">
            {isPlaceholderEmail(history?.patient.email || patient?.email)
              ? "No portal email"
              : history?.patient.email || patient?.email}{" "}
            · {history?.patient.phone || patient?.phone || "No phone recorded"}
          </p>
        </div>
        <div className="patient-actions">
          {canEditDetails && (
            <button
              className="secondary-button"
              onClick={() => setDetailsOpen(true)}
            >
              <Pencil size={15} />
              Edit details
            </button>
          )}
          {canEmergency && (
            <button
              className="emergency-button"
              onClick={() => setEmergencyOpen(true)}
            >
              <Siren size={15} />
              Break-glass
            </button>
          )}
        </div>
      </header>
      {message && <div className="inline-info">{message}</div>}
      {error && <div className="inline-error">{error}</div>}
      <div className="patient-chart-tabs">
        <TabButton
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={<HeartPulse size={15} />}
          text="Overview"
        />
        <TabButton
          active={tab === "identity"}
          onClick={() => setTab("identity")}
          icon={<Users size={15} />}
          text="Identity & care team"
        />
        <TabButton
          active={tab === "clinical"}
          onClick={() => setTab("clinical")}
          icon={<Stethoscope size={15} />}
          text="Clinical record"
        />
        <TabButton
          active={tab === "activity"}
          onClick={() => setTab("activity")}
          icon={<History size={15} />}
          text="Activity & access"
        />
      </div>
      <div className="scope-banner">
        <ShieldCheck size={17} />
        <span>
          <strong>
            {history?.scope === "detailed"
              ? "Hospital detailed record"
              : "Summary clinical view"}
          </strong>
          <small>
            {history?.scope === "detailed"
              ? "This hospital can review the complete record available for this patient."
              : "Detailed information requires the appropriate hospital access or consent."}
          </small>
        </span>
      </div>
      {tab === "overview" && (
        <OverviewTab
          history={history}
          relationship={currentRelationship}
          onClinical={() => setTab("clinical")}
        />
      )}{" "}
      {tab === "identity" && (
        <IdentityTab
          history={history}
          relationship={currentRelationship}
          onEdit={() => setDetailsOpen(true)}
          canEdit={canEditDetails}
        />
      )}{" "}
      {tab === "clinical" && (
        <ClinicalTab
          history={history}
          canEditAssessment={canEditAssessment}
          onEditAssessment={() => setAssessmentOpen(true)}
          canVerify={canVerify}
          onVerify={verifySession}
        />
      )}{" "}
      {tab === "activity" && <ActivityTab history={history} />}{" "}
      {detailsOpen && (
        <PatientDetailsModal
          patient={
            history?.patient || {
              id: patient?._id || "",
              name: patient?.name || "",
              email: patient?.email || "",
              phone: patient?.phone,
            }
          }
          profile={history?.profile}
          onClose={() => setDetailsOpen(false)}
          onSave={saveDetails}
        />
      )}{" "}
      {assessmentOpen && (
        <BaselineForm
          patientId={patient?._id || ""}
          hospitalId={hospital._id}
          initial={history?.baselineAssessments?.[0]}
          onClose={() => setAssessmentOpen(false)}
          onSaved={(text) => {
            setAssessmentOpen(false);
            setMessage(text);
            reload();
          }}
        />
      )}{" "}
      {emergencyOpen && (
        <BreakGlassForm
          patientId={patient?._id || ""}
          hospitalId={hospital._id}
          onClose={() => setEmergencyOpen(false)}
          onGranted={(text) => {
            setEmergencyOpen(false);
            setMessage(text);
            reload();
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  text: string;
}) {
  return (
    <button className={`chart-tab ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      {text}
    </button>
  );
}
function OverviewTab({
  history,
  relationship,
  onClinical,
}: {
  history: PatientHistory | null;
  relationship: PatientRelationship;
  onClinical: () => void;
}) {
  const sessions = history?.dialysisSessions || [];
  const latest = sessions[0];
  return (
    <div className="chart-grid">
      <section className="card chart-summary">
        <div className="section-title">
          <HeartPulse size={17} />
          <h2>Care snapshot</h2>
        </div>
        <div className="snapshot-grid">
          <Snapshot label="MRN" value={relationship.mrn || "Not assigned"} />
          <Snapshot
            label="Primary doctor"
            value={relationship.primaryDoctor?.name || "Unassigned"}
          />
          <Snapshot
            label="Assistant doctors"
            value={String(relationship.assistantDoctors?.length || 0)}
          />
          <Snapshot label="PD sessions" value={String(sessions.length)} />
          <Snapshot
            label="Treatment plans"
            value={String(history?.treatmentPlanVersions?.length || 0)}
          />
          <Snapshot
            label="Latest session"
            value={latest?.status ? label(latest.status) : "No sessions"}
          />
        </div>
        <button className="text-button" onClick={onClinical}>
          Open clinical record →
        </button>
      </section>
      <section className="card">
        <div className="section-title">
          <Stethoscope size={17} />
          <h2>Clinical highlights</h2>
        </div>
        <Details data={history?.profile || null} limit={8} />
      </section>
      <section className="card">
        <div className="section-title">
          <Users size={17} />
          <h2>Care team</h2>
        </div>
        <Team relationship={relationship} />
      </section>
      <section className="card">
        <div className="section-title">
          <Activity size={17} />
          <h2>Recent activity</h2>
        </div>
        <ActivityList items={(history?.activity || []).slice(0, 5)} />
      </section>
    </div>
  );
}
function IdentityTab({
  history,
  relationship,
  onEdit,
  canEdit,
}: {
  history: PatientHistory | null;
  relationship: PatientRelationship;
  onEdit: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="chart-grid">
      <section className="card">
        <div className="card-heading">
          <div>
            <div className="section-title">
              <Users size={17} />
              <h2>Identity and contact</h2>
            </div>
          </div>
          {canEdit && (
            <button className="secondary-button compact" onClick={onEdit}>
              <Pencil size={14} />
              Edit
            </button>
          )}
        </div>
        <Details
          data={{
            Name: history?.patient.name,
            Email: isPlaceholderEmail(history?.patient.email)
              ? "No portal email"
              : history?.patient.email,
            Phone: history?.patient.phone,
            MRN: relationship.mrn,
            ...history?.profile,
          }}
          limit={30}
        />
      </section>
      <section className="card">
        <div className="section-title">
          <Users size={17} />
          <h2>Care team</h2>
        </div>
        <Team relationship={relationship} />
      </section>
    </div>
  );
}
function ClinicalTab({
  history,
  canEditAssessment,
  onEditAssessment,
  canVerify,
  onVerify,
}: {
  history: PatientHistory | null;
  canEditAssessment: boolean;
  onEditAssessment: () => void;
  canVerify: boolean;
  onVerify: (
    session: { _id?: string; sessionId?: string },
    notes: string,
  ) => Promise<void>;
}) {
  return (
    <div className="profile-grid">
      <section className="card">
        <div className="card-heading">
          <div className="section-title">
            <ClipboardList size={17} />
            <h2>Baseline assessment and plans</h2>
          </div>
          {canEditAssessment && (
            <button
              className="secondary-button compact"
              onClick={onEditAssessment}
            >
              <Pencil size={14} />
              Edit assessment
            </button>
          )}
        </div>
        <TreatmentPlanCard
          assessment={history?.baselineAssessments?.[0]}
          versions={history?.treatmentPlanVersions}
        />
      </section>
      <section className="card">
        <div className="section-title">
          <FileText size={17} />
          <h2>PD session history</h2>
        </div>
        <DialysisSessionList
          items={history?.dialysisSessions || []}
          canVerify={canVerify}
          onVerify={onVerify}
        />
      </section>
      <section className="card">
        <div className="section-title">
          <FileText size={17} />
          <h2>Material and supply sessions</h2>
        </div>
        <RecordList
          items={history?.materialSessions || []}
          label="material session"
        />
      </section>
    </div>
  );
}
function ActivityTab({ history }: { history: PatientHistory | null }) {
  return (
    <section className="card">
      <div className="section-title">
        <History size={17} />
        <h2>Patient activity and access</h2>
      </div>
      <p className="muted">
        Record views, updates, clinical actions, and security events for this
        hospital relationship.
      </p>
      <ActivityList items={history?.activity || []} />
    </section>
  );
}
function Snapshot({ label: title, value }: { label: string; value: string }) {
  return (
    <div className="snapshot">
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}
function Team({ relationship }: { relationship: PatientRelationship }) {
  return (
    <div className="team-list">
      <TeamRow role="Primary doctor" name={relationship.primaryDoctor?.name} />
      {(relationship.assistantDoctors || []).map((member) => (
        <TeamRow key={member._id} role="Assistant doctor" name={member.name} />
      ))}
      {(relationship.careTeam || []).map((member) => (
        <TeamRow
          key={member._id}
          role={label(member.role || "Care team")}
          name={member.name}
        />
      ))}
      {!relationship.primaryDoctor &&
        !relationship.assistantDoctors?.length &&
        !relationship.careTeam?.length && (
          <p className="muted">No care team assigned.</p>
        )}
    </div>
  );
}
function TeamRow({ role, name }: { role: string; name?: string }) {
  return (
    <div className="team-row">
      <span className="activity-avatar">{name?.slice(0, 1) || "?"}</span>
      <span>
        <strong>{name || "Unassigned"}</strong>
        <small>{role}</small>
      </span>
    </div>
  );
}
function ActivityList({
  items,
}: {
  items: Array<{
    _id: string;
    action: string;
    occurredAt: string;
    actor?: { name: string; role: string };
  }>;
}) {
  return items.length ? (
    <div className="record-list">
      {items.map((item) => (
        <div className="record-row" key={item._id}>
          <span>
            <strong>{label(item.action.replaceAll(".", " "))}</strong>
            <small>
              {item.actor?.name || "System"} · {item.actor?.role || "system"}
            </small>
          </span>
          <time>{new Date(item.occurredAt).toLocaleString()}</time>
        </div>
      ))}
    </div>
  ) : (
    <p className="muted">No activity recorded yet.</p>
  );
}
function Details({
  data,
  limit,
}: {
  data: Record<string, unknown> | null;
  limit: number;
}) {
  if (!data) return <p className="muted">No details recorded.</p>;
  return (
    <div className="detail-list">
      {Object.entries(data)
        .filter(
          ([, value]) =>
            value !== null &&
            value !== "" &&
            value !== undefined &&
            typeof value !== "object",
        )
        .slice(0, limit)
        .map(([key, value]) => (
          <div key={key}>
            <small>{label(key)}</small>
            <strong>{String(value)}</strong>
          </div>
        ))}
      {Object.entries(data)
        .filter(([, value]) => Array.isArray(value) && value.length)
        .slice(0, limit)
        .map(([key, value]) => (
          <div key={key}>
            <small>{label(key)}</small>
            <strong>{(value as unknown[]).join(", ")}</strong>
          </div>
        ))}
    </div>
  );
}
function RecordList({
  items,
  label: itemLabel,
}: {
  items: Array<Record<string, unknown>>;
  label: string;
}) {
  if (!items.length)
    return <p className="muted">No {itemLabel} records found.</p>;
  return (
    <div className="record-list">
      {items.slice(0, 10).map((item, index) => (
        <div className="record-row" key={String(item._id || index)}>
          <span>
            <strong>
              {String(item.status || `${itemLabel} ${index + 1}`)}
            </strong>
            <small>
              {item.createdAt
                ? new Date(String(item.createdAt)).toLocaleDateString()
                : "Recorded"}
            </small>
          </span>
          <span className="status-pill">
            {String(item.status || "Recorded")}
          </span>
        </div>
      ))}
    </div>
  );
}

function PatientDetailsModal({
  patient,
  profile,
  onClose,
  onSave,
}: {
  patient: { id: string; name: string; email: string; phone?: string };
  profile: Record<string, unknown> | null | undefined;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: patient.name || "",
    email: isPlaceholderEmail(patient.email) ? "" : patient.email || "",
    phone: patient.phone || "",
    dateOfBirth: String(profile?.dateOfBirth || ""),
    gender: String(profile?.gender || ""),
    address: String(profile?.address || ""),
    bloodGroup: String(profile?.bloodGroup || ""),
    primaryDiagnosis: String(profile?.primaryDiagnosis || ""),
    dialysisType: String(profile?.dialysisType || ""),
    allergies: Array.isArray(profile?.allergies)
      ? profile?.allergies.join(", ")
      : "",
    comorbidities: Array.isArray(profile?.comorbidities)
      ? profile?.comorbidities.join(", ")
      : "",
    emergencyName: String(
      (profile?.emergencyContact as Record<string, unknown>)?.name || "",
    ),
    emergencyPhone: String(
      (profile?.emergencyContact as Record<string, unknown>)?.phone || "",
    ),
    emergencyRelation: String(
      (profile?.emergencyContact as Record<string, unknown>)?.relation || "",
    ),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: form.address,
        bloodGroup: form.bloodGroup,
        primaryDiagnosis: form.primaryDiagnosis,
        dialysisType: form.dialysisType,
        allergies: form.allergies
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        comorbidities: form.comorbidities
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        emergencyContact: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relation: form.emergencyRelation,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update patient");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Edit patient record" onClose={onClose}>
      <form className="registration-form" onSubmit={submit}>
        <fieldset>
          <legend>Identity and contact</legend>
          <div className="form-grid">
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
              />
            </label>
            <label>
              Gender
              <input
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              />
            </label>
            <label>
              Blood group
              <input
                value={form.bloodGroup}
                onChange={(e) => set("bloodGroup", e.target.value)}
              />
            </label>
          </div>
          <label>
            Address
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              rows={2}
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Clinical profile</legend>
          <div className="form-grid">
            <label>
              Primary diagnosis
              <input
                value={form.primaryDiagnosis}
                onChange={(e) => set("primaryDiagnosis", e.target.value)}
              />
            </label>
            <label>
              PD modality
              <input
                value={form.dialysisType}
                onChange={(e) => set("dialysisType", e.target.value)}
              />
            </label>
            <label>
              Allergies
              <input
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
              />
            </label>
            <label>
              Comorbidities
              <input
                value={form.comorbidities}
                onChange={(e) => set("comorbidities", e.target.value)}
              />
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>Emergency contact</legend>
          <div className="form-grid">
            <label>
              Name
              <input
                value={form.emergencyName}
                onChange={(e) => set("emergencyName", e.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                value={form.emergencyPhone}
                onChange={(e) => set("emergencyPhone", e.target.value)}
              />
            </label>
            <label>
              Relationship
              <input
                value={form.emergencyRelation}
                onChange={(e) => set("emergencyRelation", e.target.value)}
              />
            </label>
          </div>
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BaselineForm({
  patientId,
  hospitalId,
  initial,
  onClose,
  onSaved,
}: {
  patientId: string;
  hospitalId: string;
  initial?: Record<string, unknown>;
  onClose: () => void;
  onSaved: (text: string) => void;
}) {
  const [diagnosis, setDiagnosis] = useState(
    String(initial?.primaryDiagnosis || ""),
  );
  const [dialysisType, setDialysisType] = useState(
    String(initial?.dialysisType || ""),
  );
  const [advice, setAdvice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.updateBaseline({
        patientId,
        hospitalId,
        primaryDiagnosis: diagnosis,
        dialysisType,
        planAndAdvice: { followUpInstructions: advice },
      });
      onSaved("Baseline assessment saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save assessment",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Baseline assessment" onClose={onClose}>
      <form className="invite-form" onSubmit={submit}>
        <label>
          Primary diagnosis
          <input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
          />
        </label>
        <label>
          PD modality
          <input
            value={dialysisType}
            onChange={(e) => setDialysisType(e.target.value)}
            placeholder="CAPD or APD"
          />
        </label>
        <label>
          Follow-up instructions
          <textarea
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="Next review and care instructions"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving…" : "Save assessment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function BreakGlassForm({
  patientId,
  hospitalId,
  onClose,
  onGranted,
}: {
  patientId: string;
  hospitalId: string;
  onClose: () => void;
  onGranted: (text: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.breakGlass(patientId, hospitalId, reason, 60);
      onGranted("Emergency access granted for 60 minutes.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to grant emergency access",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Break-glass access"
      eyebrow="Emergency access"
      onClose={onClose}
    >
      <p className="muted">
        This action is audited and expires after 60 minutes.
      </p>
      <form className="invite-form" onSubmit={submit}>
        <label>
          Clinical reason
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={10}
            maxLength={500}
            required
            placeholder="Describe the immediate clinical need"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="emergency-button" disabled={busy}>
            <Siren size={15} />
            {busy ? "Granting…" : "Grant access"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Modal({
  title,
  eyebrow = "Clinical action",
  onClose,
  children,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
