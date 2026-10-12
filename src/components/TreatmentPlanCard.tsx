import '../plan.css';

type TreatmentPlan = {
  updatedAt?: string;
  createdAt?: string;
  dialysisType?: string;
  pdPrescription?: Array<{ dwellTiming?: string; solutionStrength?: string; fillVolume?: number; dwellDurationHours?: number; numberOfExchanges?: number; icodextrinUsed?: boolean }>;
  planAndAdvice?: { advisedPrescription?: string; medications?: string; followUpInstructions?: string };
  planVersions?: Array<{ version: number; createdAt?: string }>;
};

export function TreatmentPlanCard({ assessment, versions = [] }: { assessment?: Record<string, unknown>; versions?: Array<{ version: number; plan: Record<string, unknown>; createdAt?: string }> }) {
  const plan = (assessment || {}) as TreatmentPlan;
  const prescription = plan.pdPrescription || [];
  const advice = plan.planAndAdvice || {};
  const updated = plan.updatedAt || plan.createdAt;
  const versionHistory = versions.length ? versions : (plan.planVersions || []);
  const hasPlan = Boolean(plan.dialysisType || prescription.length || advice.advisedPrescription || advice.medications || advice.followUpInstructions);
  if (!hasPlan) return <p className="muted">No treatment plan recorded.</p>;
  return <div className="treatment-plan"><div className="plan-meta"><span>Current treatment plan</span><small>{updated ? `Updated ${new Date(updated).toLocaleDateString()}` : 'Date unavailable'}</small></div>{plan.dialysisType && <div className="plan-field"><small>Dialysis type</small><strong>{plan.dialysisType}</strong></div>}{prescription.length > 0 && <div className="prescription-list">{prescription.map((item,index)=><div className="prescription-row" key={index}><strong>Exchange {index+1}</strong><span>{[item.dwellTiming,item.solutionStrength,item.fillVolume?`${item.fillVolume} mL`:'',item.dwellDurationHours?`${item.dwellDurationHours} h dwell`:'',item.numberOfExchanges?`${item.numberOfExchanges} exchanges`:'',item.icodextrinUsed?'Icodextrin':''].filter(Boolean).join(' · ') || 'Details unavailable'}</span></div>)}</div>}{(advice.advisedPrescription || advice.medications || advice.followUpInstructions) && <div className="plan-advice">{advice.advisedPrescription && <div><small>Prescriber advice</small><p>{advice.advisedPrescription}</p></div>}{advice.medications && <div><small>Medications</small><p>{advice.medications}</p></div>}{advice.followUpInstructions && <div><small>Follow-up</small><p>{advice.followUpInstructions}</p></div>}</div>}{versionHistory.length > 0 && <div className="plan-versions"><small>Recorded versions</small>{versionHistory.map((item)=><div key={item.version}><span>Version {item.version}</span><time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date unavailable'}</time></div>)}</div>}</div>;
}
