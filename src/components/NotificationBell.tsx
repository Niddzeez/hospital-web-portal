import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { api, type Notification } from '../services/apiClient';
import './notification.css';

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try { const data = await api.notifications(); setItems(data.notifications || []); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load notifications'); }
  }

  useEffect(() => { load(); }, []);
  const unread = items.filter((item) => !item.readAt).length;

  async function markRead(item: Notification) {
    if (item.readAt) return;
    try { await api.readNotification(item._id); setItems((current) => current.map((entry) => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update notification'); }
  }

  return <div className="notification-menu">
    <button className="icon-button notification-trigger" aria-label="Notifications" onClick={() => setOpen((value) => !value)}><Bell size={18}/>{unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}</button>
    {open && <div className="notification-popover">
      <div className="notification-heading"><strong>Notifications</strong><button className="text-button" onClick={load}>Refresh</button></div>
      {error && <p className="form-error">{error}</p>}
      {!items.length ? <p className="muted notification-empty">You’re all caught up.</p> : items.map((item) => <button className={`notification-item ${item.readAt ? 'read' : ''}`} key={item._id} onClick={() => { void markRead(item); if (item.actionUrl) window.location.assign(item.actionUrl); }}><span className="notification-icon">{item.readAt ? <Check size={14}/> : <Bell size={14}/>}</span><span><strong>{item.title}</strong><small>{item.message}</small><time>{new Date(item.createdAt).toLocaleString()}</time>{item.actionUrl && <em>Open related record</em>}</span></button>)}
    </div>}
  </div>;
}
