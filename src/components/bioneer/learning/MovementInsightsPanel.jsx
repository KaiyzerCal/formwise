/**
 * MovementInsightsPanel.jsx
 * Displays personalized movement analytics and learning insights
 * Integrated into SessionHistory and Analytics pages
 */

import React, { useState, useEffect } from 'react';
import { calculateMovementBaseline } from './UserMovementModel';
import { getMovementMetrics } from './SessionLearningEngine';
import { getConsistencyRating } from './ConsistencyAnalyzer';
import { COLORS, FONT } from '../ui/DesignTokens';

export default function MovementInsightsPanel({ movement }) {
  const [baseline, setBaseline] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovementData();
  }, [movement]);

  async function loadMovementData() {
    setLoading(true);
    try {
      const base = await calculateMovementBaseline(movement);
      setBaseline(base);

      const metrics = await getMovementMetrics(movement, 10);
      const sessionGroups = groupRepsBySession(metrics);
      setRecentSessions(sessionGroups);
    } catch (err) {
      console.error('Failed to load movement data:', err);
    } finally {
      setLoading(false);
    }
  }

  function groupRepsBySession(metrics) {
    if (metrics.length === 0) return [];

    const groups = [];
    let currentSession = [metrics[0]];

    for (let i = 1; i < metrics.length; i++) {
      const timeDiff = metrics[i - 1].timestamp - metrics[i].timestamp;
      if (timeDiff < 5 * 60 * 1000) {
        // Same session if < 5min apart
        currentSession.push(metrics[i]);
      } else {
        groups.push(currentSession);
        currentSession = [metrics[i]];
      }
    }
    if (currentSession.length > 0) groups.push(currentSession);

    return groups.map((session, idx) => ({
      id: idx,
      reps: session,
      date: new Date(session[0].timestamp).toLocaleDateString(),
      avgScore: Math.round(session.reduce((sum, r) => sum + r.formScore, 0) / session.length),
      repCount: session.length,
    }));
  }

  if (loading) {
    return (
      <div className="p-6 text-center" style={{ color: COLORS.textTertiary }}>
        Loading insights...
      </div>
    );
  }

  if (!baseline && recentSessions.length === 0) {
    return (
      <div className="p-6 text-center" style={{ color: COLORS.textTertiary }}>
        No data yet. Complete a session to see insights.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" style={{ background: COLORS.surface, borderRadius: '12px' }}>
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold" style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
          {movement.toUpperCase()} INSIGHTS
        </h2>
        <p className="text-xs mt-1" style={{ color: COLORS.textTertiary }}>
          Your personal movement profile based on {baseline?.sessionCount || 0} sessions
        </p>
      </div>

      {/* Baseline Stats */}
      {baseline && (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg border"
            style={{ background: COLORS.bg, borderColor: COLORS.border }}
          >
            <span className="text-xs text-gray-500 block mb-2">AVG FORM SCORE</span>
            <span
              className="text-2xl font-bold"
              style={{
                color: baseline.avgFormScore >= 85 ? '#22C55E' : baseline.avgFormScore >= 70 ? '#EAB308' : '#EF4444',
              }}
            >
              {baseline.avgFormScore}
            </span>
          </div>
          <div
            className="p-4 rounded-lg border"
            style={{ background: COLORS.bg, borderColor: COLORS.border }}
          >
            <span className="text-xs text-gray-500 block mb-2">STABILITY</span>
            <span className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              {(baseline.stabilityScore * 100).toFixed(0)}%
            </span>
          </div>
          <div
            className="p-4 rounded-lg border"
            style={{ background: COLORS.bg, borderColor: COLORS.border }}
          >
            <span className="text-xs text-gray-500 block mb-2">AVG TEMPO</span>
            <span className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
              {baseline.avgTempo}s
            </span>
          </div>
          <div
            className="p-4 rounded-lg border"
            style={{ background: COLORS.bg, borderColor: COLORS.border }}
          >
            <span className="text-xs text-gray-500 block mb-2">MOST COMMON FAULT</span>
            <span className="text-sm font-mono text-orange-500">
              {baseline.commonFault ? baseline.commonFault.replace(/_/g, ' ') : 'None'}
            </span>
          </div>
        </div>
      )}

      {/* Score Trend */}
      {recentSessions.length > 0 && (
        <div
          className="p-4 rounded-lg border"
          style={{ background: COLORS.bg, borderColor: COLORS.border }}
        >
          <span className="text-xs font-bold mb-3 block" style={{ color: COLORS.gold }}>
            RECENT TREND
          </span>
          <div className="flex items-end gap-2 h-20">
            {recentSessions.slice(0, 5).map((session, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-t-lg cursor-pointer group relative"
                style={{
                  height: `${(session.avgScore / 100) * 100}%`,
                  background: session.avgScore >= 85 ? '#22C55E' : session.avgScore >= 70 ? '#EAB308' : '#EF4444',
                  opacity: 0.7,
                }}
                title={`${session.avgScore}/100 (${session.date})`}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 text-[8px] text-center pb-1"
                  style={{ color: COLORS.textPrimary }}
                >
                  {session.avgScore}
                </div>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-500 mt-2 block">Last {recentSessions.length} sessions</span>
        </div>
      )}

      {/* Fault Summary */}
      {baseline?.commonFault && (
        <div
          className="p-4 rounded-lg border"
          style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <span className="text-xs font-bold mb-2 block" style={{ color: '#EF4444' }}>
            PRIORITY FOCUS
          </span>
          <p className="text-sm" style={{ color: COLORS.textPrimary }}>
            Detected in {baseline.faultFrequency}% of your reps. Cue: Focus on body position at bottom position.
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div
        className="p-4 rounded-lg border text-center"
        style={{ background: 'rgba(201, 168, 76, 0.05)', borderColor: `${COLORS.gold}30` }}
      >
        <p className="text-xs" style={{ color: COLORS.textSecondary }}>
          Complete more sessions to unlock personalized coaching recommendations.
        </p>
      </div>
    </div>
  );
}