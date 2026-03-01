import React, { useContext, useEffect, useState } from 'react';
import PaperCard from '../components/PaperCard';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import NotificationBell from '../components/NotificationBell';
import TopicManager from '../components/TopicManager';

const CATEGORIES = [
  { id: 'cs.AI', label: 'Artificial Intelligence' },
  { id: 'cs.LG', label: 'Machine Learning' },
  { id: 'cs.CV', label: 'Computer Vision' },
  { id: 'cs.CL', label: 'NLP' },
  { id: 'cs.RO', label: 'Robotics' },
  { id: 'cs.CR', label: 'Cryptography' },
];

const SORTS = [
  { id: 'recent', label: 'Recent' },
  { id: 'novelty', label: 'Most Novel' },
  { id: 'trending', label: 'Trending' },
];

const StatBar = ({ stats }) => {
  if (!stats?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20 }}>
      {stats.map((s) => (
        <div
          key={s.category}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 14px',
            minWidth: 120,
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{s.category}</div>
          <div style={{ fontSize: 20, color: '#0f172a', fontWeight: 700 }}>{s.recent_count}</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.signal}</div>
        </div>
      ))}
    </div>
  );
};

const AccessBanner = ({ access }) => {
  if (!access) return null;

  if (access.is_premium) {
    return (
      <div
        style={{
          background: 'linear-gradient(90deg, #082f49 0%, #0f172a 100%)',
          color: '#e2e8f0',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Pro active: full intelligence is visible and papers auto-analyze in the background while you browse.
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff7ed',
        color: '#9a3412',
        border: '1px solid #fdba74',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 16,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Free plan: novelty, trend and reading time are always free. Manual AI unlocks left today:{' '}
      {access.remaining_today}/{access.free_daily_limit}.
    </div>
  );
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [papers, setPapers] = useState([]);
  const [stats, setStats] = useState([]);
  const [access, setAccess] = useState(null);
  const [category, setCategory] = useState('cs.AI');
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;

  useEffect(() => {
    fetch(`${API_BASE_URL}/papers/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d.stats || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPapers([]);
    setOffset(0);
    setHasMore(true);
    loadPapers(0, true);
  }, [category, sort]);

  const loadPapers = async (currentOffset = 0, reset = false) => {
    setLoading(true);
    try {
      const userId = user?.id ? `&user_id=${user.id}` : '';
      const url = `${API_BASE_URL}/papers?category=${category}&limit=${LIMIT}&offset=${currentOffset}&sort=${sort}${userId}`;
      const res = await fetch(url);
      const data = await res.json();

      const incoming = data.papers || [];
      setPapers((prev) => (reset ? incoming : [...prev, ...incoming]));
      setHasMore(incoming.length === LIMIT);
      setOffset(currentOffset + incoming.length);

      if (data.access) {
        setAccess((prev) => ({ ...(prev || {}), ...data.access }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '36px 18px' }}>

        {/* 🔔 Header with Notification Bell */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 750,
                color: '#0f172a',
                letterSpacing: -0.5,
                marginBottom: 4,
              }}
            >
              Research Feed
            </h1>
            <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <NotificationBell />
        </div>

        <AccessBanner access={access} />
        <StatBar stats={stats} />

        {/* 🧠 Topic Manager (NEW) */}
        <TopicManager />

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  border: category === c.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
                  background: category === c.id ? '#0f172a' : '#fff',
                  color: category === c.id ? '#fff' : '#334155',
                  borderRadius: 999,
                  padding: '7px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              border: '1px solid #cbd5e1',
              background: '#fff',
              borderRadius: 10,
              padding: '8px 10px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Papers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {papers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              access={access}
              onUsageUpdate={(usage) =>
                setAccess((prev) => ({ ...(prev || {}), ...(usage || {}) }))
              }
            />
          ))}
        </div>

        {loading && (
          <div style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
            Loading papers...
          </div>
        )}

        {!loading && hasMore && (
          <button
            onClick={() => loadPapers(offset)}
            style={{
              marginTop: 20,
              width: '100%',
              border: '1px solid #cbd5e1',
              background: '#fff',
              borderRadius: 10,
              padding: '11px 12px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Load more papers
          </button>
        )}

        {!loading && !hasMore && papers.length > 0 && (
          <div
            style={{
              marginTop: 18,
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            End of list
          </div>
        )}
      </div>
    </div>
  );
}