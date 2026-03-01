import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../config/api';

const SUGGESTIONS = [
  'chain-of-thought reasoning',
  'diffusion models',
  'RLHF',
  'multimodal learning',
  'LLM alignment',
  'neural architecture search',
  'retrieval augmented generation',
  'federated learning',
  'vision transformers',
  'mixture of experts',
  'speculative decoding',
  'protein structure prediction',
];

export default function TopicManager() {
  const { user } = useContext(AuthContext);
  const [topics, setTopics] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const isPremium = Boolean(user?.is_premium);
  const FREE_LIMIT = 3;

  useEffect(() => {
    if (user?.id) fetchTopics();
  }, [user]);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/topics?user_id=${user.id}`);
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {
      setTopics([]);
    }
  };

  const addTopic = async (topicText) => {
    const topic = (topicText || input).trim();
    if (!topic) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, user_id: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail?.message || data.detail || 'Failed to add topic');
        return;
      }

      setInput('');
      await fetchTopics();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const removeTopic = async (topicId) => {
    try {
      await fetch(`${API_BASE_URL}/topics/${topicId}?user_id=${user.id}`, { method: 'DELETE' });
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
    } catch {
      // no-op
    }
  };

  const atLimit = !isPremium && topics.length >= FREE_LIMIT;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '24px 28px',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Watched Topics</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Get alerts when new papers match your interests.
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#64748b',
            background: '#f8fafc',
            padding: '4px 10px',
            borderRadius: 20,
          }}
        >
          {topics.length}/{isPremium ? 'inf' : FREE_LIMIT}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && addTopic()}
          placeholder={atLimit ? 'Upgrade to Pro for unlimited topics' : 'e.g. diffusion models, LLM reasoning'}
          disabled={atLimit || loading}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: `1.5px solid ${error ? '#fca5a5' : '#e2e8f0'}`,
            borderRadius: 10,
            fontSize: 14,
            outline: 'none',
            background: atLimit ? '#f8fafc' : '#fff',
            color: '#0f172a',
          }}
        />
        <button
          onClick={() => addTopic()}
          disabled={atLimit || loading || !input.trim()}
          style={{
            background: atLimit || !input.trim() ? '#f1f5f9' : '#0f172a',
            color: atLimit || !input.trim() ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: atLimit ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : '+ Watch'}
        </button>
      </div>

      {error ? (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#b91c1c',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          {!isPremium ? (
            <button
              onClick={() => navigate('/settings')}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              Upgrade
            </button>
          ) : null}
        </div>
      ) : null}

      {topics.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {topics.map((topic) => (
            <div
              key={topic.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                borderRadius: 10,
                padding: '12px 16px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{topic.topic}</span>
                  {topic.unread_count > 0 ? (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 10,
                      }}
                    >
                      {topic.unread_count} new
                    </span>
                  ) : null}
                </div>
                {topic.keywords?.length > 0 ? (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                    Matching: {topic.keywords.slice(0, 5).join(', ')}
                  </div>
                ) : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{topic.total_matches} papers</span>
                <button
                  onClick={() => removeTopic(topic.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '2px 4px',
                    borderRadius: 4,
                  }}
                  title="Remove topic"
                >
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {topics.length === 0 && !atLimit ? (
        <div>
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              fontWeight: 600,
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Popular topics
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.slice(0, 8).map((s) => (
              <button
                key={s}
                onClick={() => addTopic(s)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '5px 12px',
                  fontSize: 12,
                  color: '#475569',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
