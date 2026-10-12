import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { api, type Hospital } from '../services/apiClient';

type Props = { hospital: Hospital; onClose: () => void; onCreated: (message: string) => void };

export function AddDoctorModal({ hospital, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      const result = await api.createDoctor(hospital._id, { name: name.trim(), email: email.trim(), password, ...(phone.trim() ? { phone: phone.trim() } : {}) });
      setCreated({ name: result.doctor.name, email: result.doctor.email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add doctor');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{hospital.name}</p>
            <h2>{created ? 'Doctor added' : 'Add doctor'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {created ? (
          <>
            <p className="muted">{created.name} can now sign in with these credentials. Share them securely — the password will not be shown again.</p>
            <div className="invite-token">Email: {created.email}<br />Password: {created.password}</div>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => onCreated(`Doctor ${created.name} added to ${hospital.name}.`)}>Done</button>
            </div>
          </>
        ) : (
          <form className="invite-form" onSubmit={submit}>
            <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label>Email (login ID)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" required /></label>
            <label>Phone <span className="optional">(optional)</span><input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label>
              Password
              <span style={{ display: 'flex', gap: 8 }}>
                <input style={{ flex: 1 }} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required />
                <button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
              <span className="optional">At least 8 characters.</span>
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button className="primary-button" disabled={busy}>{busy ? 'Adding…' : 'Add doctor'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}