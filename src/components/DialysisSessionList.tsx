import { useState } from 'react';
import type { DialysisSessionRecord } from '../services/apiClient';

export function DialysisSessionList({ items, canVerify, onVerify }: { items: Array<Record<string, unknown>>; canVerify: boolean; onVerify: (session: DialysisSessionRecord, notes: string) => Promise<void> }) {
  const sessions = items as DialysisSessionRecord[];

  if (!sessions.length) return <p className="muted">No dialysis sessions found.</p>;

  return (
    <div className="session-list">
      {sessions.map((session, index) => (
        <SessionItem key={session._id || session.sessionId || index} session={session} index={index} canVerify={canVerify} onVerify={onVerify} />
      ))}
    </div>
  );
}

function SessionItem({ session, index, canVerify, onVerify }: { session: DialysisSessionRecord; index: number; canVerify: boolean; onVerify: (session: DialysisSessionRecord, notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function verify() {
    setBusy(true);
    try { await onVerify(session, notes); } finally { setBusy(false); }
  }

  return (
        <details className="session-item" key={session._id || session.sessionId || index}>
          <summary>
            <span>
              <strong>Session {session.sequence || index + 1}</strong>
              <small>{session.startedAt ? new Date(session.startedAt).toLocaleString() : 'Start time unavailable'}</small>
            </span>
            <span className={`status-pill status-${session.status || 'unknown'}`}>{session.status || 'Unknown'}</span>
          </summary>
          <div className="session-details">
            <div><small>Completed</small><strong>{session.completedAt ? new Date(session.completedAt).toLocaleString() : '—'}</strong></div>
            <div><small>Verified</small><strong>{session.verifiedAt ? `${new Date(session.verifiedAt).toLocaleString()} · ${session.verifiedByName || 'Staff'}` : 'Not verified'}</strong></div>
            {session.readings && <div className="session-clinical-data"><small>Dialysis readings</small><strong>{Object.entries(session.readings).filter(([, value]) => value !== undefined && value !== null && value !== 0).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${value}`).join(' · ') || 'No readings recorded'}</strong></div>}
            {session.voluntary && <div className="session-clinical-data"><small>Patient-reported parameters</small><strong>{Object.entries(session.voluntary).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== false).slice(0, 5).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${String(value)}`).join(' · ') || 'No patient parameters recorded'}</strong></div>}
            {session.verificationNotes && <div className="session-note"><small>Verification note</small><strong>{session.verificationNotes}</strong></div>}
            {canVerify && session.status === 'completed' && (
              <div className="session-verify">
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional verification note" maxLength={500} />
                <button className="primary-button compact" onClick={verify} disabled={busy}>{busy ? 'Verifying…' : 'Verify session'}</button>
              </div>
            )}
          </div>
        </details>
  );
}
