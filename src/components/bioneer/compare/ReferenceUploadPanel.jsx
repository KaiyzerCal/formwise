/**
 * ReferenceUploadPanel — Admin panel for uploading reference videos.
 * Uploads the video, creates a ReferenceVideo entity, and triggers processing.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const EXERCISES = [
  { id: 'squat', name: 'Squat' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'bench_press', name: 'Bench Press' },
  { id: 'overhead_press', name: 'Overhead Press' },
  { id: 'push_up', name: 'Push-Up' },
  { id: 'pull_up', name: 'Pull-Up' },
  { id: 'lunge', name: 'Lunge' },
  { id: 'barbell_row', name: 'Barbell Row' },
  { id: 'plank', name: 'Plank' },
  { id: 'hip_thrust', name: 'Hip Thrust' },
];

const VIEWS = ['side', 'front', 'rear'];

export default function ReferenceUploadPanel({ onUploaded }) {
  const [exerciseId, setExerciseId] = useState('squat');
  const [view, setView] = useState('side');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);

    try {
      // 1. Upload video file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Create entity record
      const exercise = EXERCISES.find(ex => ex.id === exerciseId);
      const record = await base44.entities.ReferenceVideo.create({
        exercise_id: exerciseId,
        exercise_name: exercise?.name || exerciseId,
        video_url: file_url,
        view,
        status: 'processing',
        is_default: false,
      });

      // 3. Trigger processing pipeline
      try {
        await base44.functions.invoke('processReferenceVideo', {
          videoId: record.id,
          videoUrl: file_url,
          exerciseId,
        });
      } catch {
        // Processing runs async — not critical if invoke returns before done
      }

      setStatus('success');
      setStatusMsg(`Uploaded "${exercise?.name}" (${view} view). Processing keypoints...`);
      onUploaded?.(record);
    } catch (err) {
      setStatus('error');
      setStatusMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-xl border"
      style={{ borderColor: COLORS.border, background: COLORS.surface }}>
      <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: COLORS.gold, fontFamily: FONT.heading }}>
        Upload Reference Video
      </h3>

      <div className="flex gap-2">
        <select
          value={exerciseId}
          onChange={e => setExerciseId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border text-[10px] appearance-none outline-none"
          style={{ background: COLORS.bg, borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          {EXERCISES.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        <select
          value={view}
          onChange={e => setView(e.target.value)}
          className="w-24 px-3 py-2 rounded-lg border text-[10px] appearance-none outline-none"
          style={{ background: COLORS.bg, borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontFamily: FONT.mono }}>
          {VIEWS.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors hover:opacity-80"
        style={{
          borderColor: COLORS.goldBorder,
          background: COLORS.goldDim,
        }}>
        {uploading ? (
          <Loader2 size={14} className="animate-spin" style={{ color: COLORS.gold }} />
        ) : (
          <Upload size={14} style={{ color: COLORS.gold }} />
        )}
        <span className="text-[10px]" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          {uploading ? 'Uploading...' : 'Choose video file'}
        </span>
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {status && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{
            background: status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${status === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
          {status === 'success' ? (
            <CheckCircle2 size={12} style={{ color: '#22C55E', flexShrink: 0, marginTop: 1 }} />
          ) : (
            <AlertCircle size={12} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
          )}
          <span className="text-[9px]" style={{ color: status === 'success' ? '#22C55E' : '#EF4444', fontFamily: FONT.mono }}>
            {statusMsg}
          </span>
        </div>
      )}
    </div>
  );
}