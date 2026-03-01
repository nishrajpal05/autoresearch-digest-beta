import React, { useContext, useEffect, useRef, useState } from 'react';
import API_BASE_URL from '../config/api';
import { AuthContext } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    const onOutsideClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/alerts?user_id=${user.id}&unread_only=true&limit=1`);
      const data = await res.json();
      setUnread(data.unread_count || 0);
    } catch {
      // no-op
    }
  };

  const fetchAlerts = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alerts?user_id=${user.id}&limit=10`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setUnread(data.unread_count || 0);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchAlerts();
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    try {
      await fetch(`${API_BASE_URL}/alerts/read?user_id=${user.id}`, { method: 'POST' });
      setUnread(0);
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch {
      // no-op
    }
  };

  const openAlert = async (alert) => {
    if (!user?.id) return;

    try {
      if (!alert.is_read) {
        await fetch(`${API_BASE_URL}/alerts/${alert.id}/read?user_id=${user.id}`, { method: 'POST' });
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a)));
        setUnread((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // keep going even if read-mark fails
    }

    setOpen(false);
    if (alert?.paper?.pdf_url) {
      window.open(alert.paper.pdf_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!user) return null;

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 16,
          color: '#64748b',
        }}
        aria-label="Open alerts"
      >
        Bell
        {unread > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 360,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
              Alerts {unread > 0 ? <span style={{ color: '#ef4444' }}>({unread})</span> : null}
            </span>
            {unread > 0 ? (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  color: '#2563eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
            ) : alerts.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#94a3b8' }}>No alerts yet</div>
                <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
                  Watch topics to get notified when papers match.
                </div>
              </div>
            ) : (
              alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => openAlert(alert)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 20px',
                    borderBottom: '1px solid #f8fafc',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    background: alert.is_read ? '#fff' : '#f0f9ff',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {!alert.is_read ? (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#2563eb',
                          marginTop: 5,
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, marginBottom: 3 }}>{alert.topic}</div>
                      <div
                        style={{
                          fontSize: 13,
                          color: '#0f172a',
                          fontWeight: 500,
                          lineHeight: 1.4,
                          marginBottom: 4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {alert.paper?.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {alert.paper?.category} ·{' '}
                        {alert.created_at
                          ? new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
