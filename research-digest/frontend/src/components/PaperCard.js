import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../config/api';

const chipStyle = {
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 999,
  padding: '4px 10px',
  letterSpacing: 0.2,
};

const NoveltyRing = ({ score }) => {
  const normalized = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : null;
  if (normalized == null) return null;

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const filled = (normalized / 100) * circumference;
  const color = normalized >= 70 ? '#0f766e' : normalized >= 40 ? '#b45309' : '#475569';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={40} height={40} viewBox="0 0 40 40" aria-label="novelty score">
        <circle cx={20} cy={20} r={radius} fill="none" stroke="#edf2f7" strokeWidth={3} />
        <circle
          cx={20}
          cy={20}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
        <text x={20} y={24} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>
          {Math.round(normalized)}
        </text>
      </svg>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Novelty</div>
    </div>
  );
};

const TrendBadge = ({ signal, delta }) => {
  const config = {
    heating: { bg: '#fff7ed', color: '#c2410c', label: `Hot +${delta ?? 0}%` },
    cooling: { bg: '#f8fafc', color: '#475569', label: `Cooling ${delta ?? 0}%` },
    steady: { bg: '#f0fdf4', color: '#15803d', label: 'Steady' },
  };
  const c = config[signal] || config.steady;
  return <span style={{ ...chipStyle, background: c.bg, color: c.color }}>{c.label}</span>;
};

export default function PaperCard({ paper, access, onBookmark, onUsageUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(Boolean(paper.is_bookmarked));
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [paperData, setPaperData] = useState(paper);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [lastFromCache, setLastFromCache] = useState(false);

  useEffect(() => {
    setPaperData(paper);
    setBookmarked(Boolean(paper.is_bookmarked));
  }, [paper]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isPremium = Boolean(access?.is_premium || user?.is_premium);
  const hasFullIntelligence = Boolean(paperData.simplified_summary && paperData.practitioner_verdict);
  const freeRemaining = access?.remaining_today ?? 0;

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!user?.id) return;

    setBookmarkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/papers/${paperData.id}/bookmark?user_id=${user.id}`, { method: 'POST' });
      const data = await res.json();
      const nextBookmarked = Boolean(data.bookmarked);
      setBookmarked(nextBookmarked);
      if (onBookmark) onBookmark(paperData.id, nextBookmarked);
    } catch (err) {
      console.error(err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.stopPropagation();
    if (!user?.id || analyzing) return;

    setAnalyzing(true);
    setAnalysisError('');

    try {
      const res = await fetch(`${API_BASE_URL}/papers/${paperData.id}/enrich?user_id=${user.id}`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        const msg = typeof data?.detail === 'string' ? data.detail : data?.detail?.message;
        setAnalysisError(msg || 'Unable to analyze this paper right now.');
        return;
      }

      if (data.paper) {
        setPaperData(data.paper);
        setLastFromCache(Boolean(data.from_cache));
      }
      if (data.usage && onUsageUpdate) {
        onUsageUpdate({
          used_today: data.usage.used,
          free_daily_limit: data.usage.limit,
          remaining_today: Math.max((data.usage.limit || 0) - (data.usage.used || 0), 0),
        });
      }
    } catch (_err) {
      setAnalysisError('Network error. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const authors = Array.isArray(paperData.authors)
    ? paperData.authors.slice(0, 3).join(', ') + (paperData.authors.length > 3 ? ` +${paperData.authors.length - 3}` : '')
    : paperData.authors || '';

  const publishedDate = paperData.published
    ? new Date(paperData.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #dbe2ef',
        borderRadius: 16,
        padding: '20px 22px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#dbe2ef';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ ...chipStyle, background: '#e0f2fe', color: '#0c4a6e' }}>{paperData.category}</span>
          <TrendBadge signal={paperData.trend_signal} delta={paperData.trend_delta} />
          <span style={{ ...chipStyle, background: '#f1f5f9', color: '#334155' }}>
            {paperData.reading_time_minutes || 5} min read
          </span>
          {hasFullIntelligence ? (
            <span style={{ ...chipStyle, background: '#ecfdf3', color: '#166534' }}>
              {lastFromCache ? 'Community cache' : 'AI ready'}
            </span>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NoveltyRing score={paperData.novelty_score} />
          <button
            type="button"
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            style={{
              border: '1px solid #cbd5e1',
              background: bookmarked ? '#eff6ff' : '#fff',
              color: bookmarked ? '#1d4ed8' : '#64748b',
              borderRadius: 8,
              height: 34,
              padding: '0 10px',
              cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {bookmarked ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <h3 style={{ margin: '12px 0 8px', color: '#0f172a', lineHeight: 1.45 }}>{paperData.title}</h3>
      <div style={{ fontSize: 13, color: '#64748b' }}>
        {authors}
        {publishedDate ? ` · ${publishedDate}` : ''}
      </div>

      {hasFullIntelligence ? (
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #2563eb',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', marginBottom: 6 }}>
              Simplified Summary
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{paperData.simplified_summary}</p>
          </div>

          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 6 }}>
              Practitioner Verdict
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{paperData.practitioner_verdict}</p>
          </div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
            Locked Intelligence
          </div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>
            Unlock both simplified summary and practitioner verdict with one analysis.
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || (!isPremium && freeRemaining <= 0)}
            style={{
              border: 'none',
              background: analyzing || (!isPremium && freeRemaining <= 0) ? '#94a3b8' : '#0f172a',
              color: '#fff',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              padding: '9px 14px',
              cursor: analyzing || (!isPremium && freeRemaining <= 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {analyzing ? 'Analyzing...' : 'Analyze this paper'}
          </button>
          <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>
            {isPremium
              ? 'Pro: auto-analysis on browse plus manual fallback.'
              : freeRemaining > 0
              ? `${freeRemaining} manual unlocks left today`
              : 'Free limit reached today (3/day).'}
          </div>
          {analysisError ? <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 12 }}>{analysisError}</div> : null}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ border: 'none', background: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          {expanded ? 'Hide abstract' : 'Show abstract'}
        </button>
      </div>

      {expanded ? <p style={{ marginTop: 8, color: '#475569', lineHeight: 1.65, fontSize: 13.5 }}>{paperData.summary}</p> : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <a
          href={paperData.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: 'none',
            background: '#0f172a',
            color: '#fff',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Open PDF
        </a>
      </div>
    </article>
  );
}
