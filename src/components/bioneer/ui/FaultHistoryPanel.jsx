import React, { useState, useEffect } from 'react';
import { getExerciseFaultStats } from '@/lib/adaptiveFeedbackEngine';
import { COLORS } from './DesignTokens';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Displays fault history and improvement progress for an exercise
 */
export default function FaultHistoryPanel({ exerciseId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseId) return;

    const fetchStats = async () => {
      setLoading(true);
      const data = await getExerciseFaultStats(exerciseId);
      setStats(data);
      setLoading(false);
    };

    fetchStats();
  }, [exerciseId]);

  if (loading || !stats) {
    return <div style={{ color: COLORS.textSecondary }}>Loading improvement data...</div>;
  }

  if (stats.total === 0) {
    return (
      <div style={{ padding: '12px', color: COLORS.textSecondary, fontSize: '12px' }}>
        No fault history yet. Keep recording sessions to track improvements.
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '12px', fontSize: '12px' }}>
      {/* Improvement Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <TrendingUp size={14} style={{ color: COLORS.correct }} />
        <span style={{ color: COLORS.textPrimary }}>
          Improvement Rate: <strong style={{ color: COLORS.gold }}>{stats.improvementRate.toFixed(0)}%</strong>
        </span>
      </div>

      {/* Active Issues */}
      {stats.active > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ color: COLORS.warning, marginBottom: '6px', fontWeight: 'bold' }}>
            Active Issues ({stats.active})
          </div>
          {stats.activeFaults.slice(0, 3).map(fault => (
            <div key={fault.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '6px', color: COLORS.textSecondary }}>
              <AlertCircle size={12} style={{ marginTop: '2px', color: COLORS.warning, flexShrink: 0 }} />
              <span>{fault.fault_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Resolved Issues */}
      {stats.resolved > 0 && (
        <div style={{ paddingTop: '8px', borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ color: COLORS.correct, marginBottom: '6px', fontWeight: 'bold' }}>
            Fixed ({stats.resolved})
          </div>
          {stats.resolvedFaults.slice(0, 2).map(fault => (
            <div key={fault.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '4px', color: COLORS.textTertiary, fontSize: '11px' }}>
              <CheckCircle2 size={11} style={{ marginTop: '2px', color: COLORS.correct, flexShrink: 0 }} />
              <span>{fault.fault_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}