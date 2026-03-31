import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { EXERCISES, getExerciseById } from "../components/bioneer/exerciseLibrary";
import { getSportsMovementById } from "../components/bioneer/sportsLibrary";
import MovementLibrary from "../components/bioneer/MovementLibrary";
import CameraView from "../components/bioneer/CameraView";
import SessionSummary from "../components/bioneer/SessionSummary";
import Disclaimer from "../components/bioneer/Disclaimer";
import HomeDashboard from "../components/bioneer/dashboard/HomeDashboard";
import { createPageUrl } from "@/utils";
import { useSessionLearning } from "../components/bioneer/learning/useSessionLearning";
import FirstLaunchWizard, { hasCompletedOnboarding } from "../components/bioneer/onboarding/FirstLaunchWizard";
import FormCheckHistoryView from "../components/bioneer/history/FormCheckHistoryView";
import FormCheckReplay from "../components/bioneer/history/FormCheckReplay";
import { saveFreestyleSession, loadFreestyleSession } from '../components/bioneer/history/sessionStorage';
import FreestyleReplay from '../components/bioneer/history/FreestyleReplay';

const DISCLAIMER_KEY = "bioneer_disclaimer_accepted";

export default function FormCheck() {
  const [phase, setPhase] = useState("select"); // select | camera | summary | history | replay
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [replaySession, setReplaySession] = useState(null);
  const [pendingRecording, setPendingRecording] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const { processSessionLearning } = useSessionLearning();

  useEffect(() => {
    const accepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!accepted) setShowDisclaimer(true);
    else if (!hasCompletedOnboarding()) setShowWizard(true);

    // Check URL params for exercise pre-selection
    const params = new URLSearchParams(window.location.search);
    const exId = params.get("exercise");
    if (exId) {
      const ex = getExerciseById(exId) || getSportsMovementById(exId);
      if (ex) setSelectedExercise(ex);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "true");
    setShowDisclaimer(false);
    if (!hasCompletedOnboarding()) setShowWizard(true);
  };

  const handleStartSession = () => {
    // Start with movement library
    setPhase("select");
  };

  const handleStartAnalysis = (movement) => {
    const ex = movement || selectedExercise;
    if (!ex) return;
    // Prevent double-start by ensuring clean state
    setSessionData(null);
    setSelectedExercise(ex);
    setPhase("camera");
  };

  const handleStopSession = (data) => {
    const { sessionId, videoBlob, poseFrames, angleFrames, cameraFacing, ...stats } = data;
    setPendingRecording({ sessionId, videoBlob, poseFrames, angleFrames, cameraFacing });
    setSessionData(stats);
    setPhase("summary");
  };

  const handleSave = async () => {
    setSaving(true);
    const { exercise_def, joint_data, reps, ...saveable } = sessionData;
    
    // Enrich session data with analytics fields for storage
    const exercise = selectedExercise || exercise_def || {};
    const enrichedData = {
      ...saveable,
      // Map exercise ID to normalized movement name
      movement_id: saveable.exercise_id || exercise.id,
      movement_name: exercise.displayName || exercise.name || saveable.exercise_id,
      // Core analytics fields (for selectors)
      rep_count: saveable.reps_detected || 0,
      average_form_score: Math.max(0, Math.min(100, saveable.form_score_overall || saveable.movement_score || 0)),
      highest_form_score: Math.max(0, Math.min(100, saveable.form_score_peak || saveable.form_score_overall || 0)),
      lowest_form_score: Math.max(0, Math.min(100, saveable.form_score_lowest || 0)),
      // Mastery-derived
      mastery_avg: reps?.length
        ? Math.round(
            reps
              .map(r => r.score)
              .filter(s => s != null && !isNaN(s))
              .reduce((a, b) => a + b, 0) / reps.length
          )
        : Math.max(0, Math.min(100, saveable.form_score_overall || 0)),
      // Tracking and fault data
      top_faults: (saveable.alerts || [])
        .map(a => a.joint)
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .slice(0, 3),
      risk_flags: [],
      body_side_bias: 'balanced',
      tracking_confidence: 75,
      // Session metadata
      session_status: 'complete',
      started_at: new Date().toISOString(),
    };

    try {
      await base44.entities.FormSession.create(enrichedData);
      // Save video + pose data to IndexedDB for full replay
      if (pendingRecording?.videoBlob instanceof Blob) {
        const { sessionId, videoBlob, poseFrames, angleFrames, cameraFacing } = pendingRecording;
        try {
          await saveFreestyleSession({
            sessionId:   sessionId || enrichedData.session_id || `formcheck-${Date.now()}`,
            mode:        'formcheck',
            category:    enrichedData.category || 'strength',
            duration:    enrichedData.duration_seconds || 0,
            videoBlob,
            poseFrames:  poseFrames  || [],
            angleFrames: angleFrames || [],
            cameraFacing: cameraFacing || 'environment',
          });
        } catch (idbErr) {
          console.warn('[FormCheck] IndexedDB save failed:', idbErr.message);
        }
      }
      setPendingRecording(null);
      // Non-blocking: run adaptive learning pipeline after save
      processSessionLearning({
        movement: enrichedData.movement_id,
        reps: reps ?? [],
        formScore: enrichedData.average_form_score,
        faults: enrichedData.top_faults,
        duration: enrichedData.duration_seconds,
        repSummaries: sessionData?.rep_summaries ?? [],
      }).catch(err => console.warn('[FormCheck] Learning pipeline error:', err));
    } catch (err) {
      console.warn('[FormCheck] Save error:', err);
    } finally {
      setSaving(false);
      setPhase("home");
      setSessionData(null);
    }
  };

  const handleDiscard = () => {
    setPhase("home");
    setSessionData(null);
    // Clear any stale refs
    setSelectedExercise(null);
  };

  const handleViewHistory = () => {
    setPhase("history");
  };

  const handleSelectHistorySession = async (session, action) => {
    try {
      const local = await loadFreestyleSession(session.session_id || session.id);
      if (local?.videoBlob instanceof Blob) {
        setReplaySession({ ...session, ...local });
      } else {
        setReplaySession(session);
      }
    } catch {
      setReplaySession(session);
    }
    setPhase("replay");
  };

  const handleDeleteReplaySession = async (sessionId) => {
    try {
      await base44.entities.FormSession.delete(sessionId);
      setPhase("history");
      setReplaySession(null);
    } catch (err) {
      console.error('[FormCheck] Delete error:', err);
    }
  };

  const handleExportReplaySession = async (session) => {
    // Placeholder for export to Technique
    // This would integrate with the technique studio export flow
    console.log('[FormCheck] Export session:', session);
    alert('Export to Technique feature coming soon');
  };

  const handleCloseReplay = () => {
    setPhase("history");
    setReplaySession(null);
  };

  if (showDisclaimer) {
    return <Disclaimer onAccept={handleAcceptDisclaimer} />;
  }

  if (showWizard) {
    return <FirstLaunchWizard onComplete={() => setShowWizard(false)} />;
  }

  if (phase === "camera" && selectedExercise) {
    return <CameraView exercise={selectedExercise} onStop={handleStopSession} />;
  }

  if (phase === "summary" && sessionData) {
    return (
      <SessionSummary
        sessionData={sessionData}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
      />
    );
  }

  if (phase === "history") {
    return (
      <FormCheckHistoryView
        onSelectSession={handleSelectHistorySession}
        onBack={() => setPhase("home")}
      />
    );
  }

  if (phase === "replay" && replaySession) {
    return (
      <FreestyleReplay
        session={replaySession}
        onClose={handleCloseReplay}
      />
    );
  }

  // Home dashboard or movement library
  if (phase === "home") {
    return (
      <HomeDashboard 
        onStartSession={handleStartSession}
        onViewHistory={handleViewHistory}
      />
    );
  }

  if (phase === "select") {
    return (
      <MovementLibrary
        selectedId={selectedExercise?.id}
        onSelect={handleStartAnalysis}
      />
    );
  }

  // Default to home
  return <HomeDashboard onStartSession={handleStartSession} />;
}