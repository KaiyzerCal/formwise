/**
 * Analyze — AI Movement Analysis Hub
 * Upload/record → processing animation → structured AI analysis output
 * This wraps existing FormCheck and LiveSession flows into a unified entry
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';
import { Camera, Upload, ArrowLeft, ChevronRight, Zap } from 'lucide-react';
import MovementLibrary from '@/components/bioneer/MovementLibrary';
import CameraView from '@/components/bioneer/CameraView';
import SessionSummary from '@/components/bioneer/SessionSummary';
import AnalysisResultsView from '@/components/analyze/AnalysisResultsView';
import { normalizeSession, sessionSaveMessage } from '@/components/bioneer/data/sessionNormalizer';
import { saveSession, updateSession } from '@/components/bioneer/data/unifiedSessionStore';
import { persistRecordedSessionVideo } from '@/components/bioneer/data/persistRecordedSessionVideo';
import { getMovementProfile } from '@/components/bioneer/movementProfiles/movementProfiles';
import { getExerciseById } from '@/components/bioneer/exerciseLibrary';
import { getSportsMovementById } from '@/components/bioneer/sportsLibrary';
import { checkAndAwardAchievements } from '@/lib/achievements';
import { awardSessionPoints } from '@/lib/gamificationEngine';
import { logFault } from '@/lib/faultAccumulator';
import { recordSession } from '@/lib/retentionEngine';
import { updateFaultHistory, checkForImprovements } from '@/lib/adaptiveFeedbackEngine';
import { useSessionLearning } from '@/components/bioneer/learning/useSessionLearning';

export default function Analyze() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('select'); // select | camera | processing | results
  const [exercise, setExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const rawDataRef = useRef(null);
  const sessionStartRef = useRef(null);
  const { processSessionLearning } = useSessionLearning();

  // Pre-select from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exId = params.get('exercise');
    if (exId) {
      const ex = getExerciseById(exId) || getSportsMovementById(exId);
      if (ex) { setExercise(ex); setPhase('camera'); }
    }
  }, []);

  const handleSelectExercise = (movement) => {
    setExercise(movement);
    sessionStartRef.current = Date.now();
    setPhase('camera');
  };

  const handleCameraStop = (rawData) => {
    rawDataRef.current = rawData;
    setPhase('processing');
    
    // Simulate brief processing delay for premium feel
    setTimeout(() => {
      const movementProfile = exercise?.id ? getMovementProfile(exercise.id) : null;
      const session = normalizeSession(rawData, {
        movementName: exercise?.name,
        category: exercise?.category,
        startedAt: sessionStartRef.current ?? Date.now(),
        movementProfileId: exercise?.id,
        movementProfile,
      });
      setSavedSession(session);
      setSessionData({ ...rawData, _canonicalSession: session, movementProfile });
      setPhase('results');
    }, 1500);
  };

  const handleSave = async () => {
    if (!savedSession) return;
    setSaving(true);
    const rawData = rawDataRef.current || {};
    
    const sessionToSave = { ...savedSession, video_storage_key: savedSession.session_id };
    const saved = await saveSession(sessionToSave);
    setSaving(false);

    // Background tasks
    persistRecordedSessionVideo({
      videoBlob: rawData.videoBlob || null,
      recordedChunks: rawData.recordedChunks || [],
      mimeType: rawData.recordingMimeType || 'video/webm',
      sessionId: saved?.session_id || savedSession.session_id,
    }).then(pv => {
      if (pv?.fileUrl) updateSession(saved?.session_id || savedSession.session_id, { video_url: pv.fileUrl }).catch(() => {});
    }).catch(() => {});

    processSessionLearning({ ...sessionToSave, reps: rawData.reps ?? [] }).catch(() => {});
    checkAndAwardAchievements().catch(() => {});
    awardSessionPoints(sessionToSave).catch(() => {});
    const faults = (sessionToSave.top_faults || []).map(f => ({ id: f, name: f }));
    updateFaultHistory(sessionToSave.exercise_id, faults).catch(() => {});
    checkForImprovements(sessionToSave.exercise_id, faults.map(f => f.id)).catch(() => {});
    const sid = saved?.session_id || savedSession.session_id;
    for (const f of sessionToSave.top_faults || []) logFault(sessionToSave.exercise_id, f, sid).catch(() => {});
    recordSession().catch(() => {});

    // Go to train with corrective workout suggestion
    navigate('/train');
  };

  const handleDiscard = () => {
    setSessionData(null);
    setSavedSession(null);
    setExercise(null);
    rawDataRef.current = null;
    setPhase('select');
  };

  // Camera phase — full screen
  if (phase === 'camera' && exercise) {
    return <CameraView exercise={exercise} onStop={handleCameraStop} />;
  }

  // Processing animation
  if (phase === 'processing') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: COLORS.bg }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-full border-4"
          style={{ borderColor: COLORS.border, borderTopColor: COLORS.gold }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-xs tracking-[0.15em] uppercase"
          style={{ color: COLORS.gold, fontFamily: FONT.mono }}
        >
          Analyzing Movement
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-2 text-[9px]"
          style={{ color: COLORS.textTertiary, fontFamily: FONT.mono }}
        >
          Detecting form issues · Measuring angles · Building correction plan
        </motion.p>
      </div>
    );
  }

  // Results phase — structured AI analysis
  if (phase === 'results' && sessionData && savedSession) {
    return (
      <AnalysisResultsView
        session={savedSession}
        rawData={sessionData}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
      />
    );
  }

  // Select phase
  return (
    <div className="flex flex-col h-full" style={{ background: COLORS.bg }}>
      <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: COLORS.border }}>
        <button onClick={() => navigate('/')} className="p-1">
          <ArrowLeft size={16} style={{ color: COLORS.textSecondary }} />
        </button>
        <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold, fontFamily: FONT.mono }}>
          Analyze Movement
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MovementLibrary selectedId={exercise?.id} onSelect={handleSelectExercise} />
      </div>
    </div>
  );
}