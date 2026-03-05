import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import UploadZone from "../components/bioneer/UploadZone";
import ExerciseBadge from "../components/bioneer/ExerciseBadge";
import UploadPlaybackScreen from "../components/bioneer/UploadPlaybackScreen";
import AfterActionReport from "../components/bioneer/AfterActionReport";
import {
  extractFrames,
  runPoseDetection,
  detectExercise,
  compareToBlueprint,
  generateReport,
} from "../components/bioneer/uploadAnalysisEngine";
import { getBlueprintForExercise } from "../components/bioneer/uploadBlueprints";
import { createPageUrl } from "@/utils";

const EXERCISE_NAMES = { squat: "Squat", deadlift: "Deadlift", pushup: "Push-up" };

// Phases:
// idle → extracting → detecting → comparing → playback → report

export default function UploadAnalysis() {
  const [phase, setPhase]       = useState("idle");      // idle|extracting|detecting|comparing|playback|report
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const [detectedExercise, setDetectedExercise] = useState(null); // { exercise, confidence }
  const [session, setSession]   = useState(null);
  const [report, setReport]     = useState(null);
  const [saving, setSaving]     = useState(false);

  const handleFile = async (file) => {
    const videoUrl = URL.createObjectURL(file);

    try {
      // 1. Extract frames
      setPhase("extracting");
      setProgress(0);
      setProgressLabel("Extracting frames...");
      const frames = await extractFrames(file, 10);

      // 2. Run pose detection
      setPhase("detecting");
      setProgress(0);
      setProgressLabel("Detecting pose...");
      const poseFrames = await runPoseDetection(frames, (pct) => {
        setProgress(pct);
        setProgressLabel(`Pose detection ${pct}%`);
      });

      // 3. Detect exercise
      setProgressLabel("Identifying exercise...");
      const detection = detectExercise(poseFrames);
      setDetectedExercise(detection);

      // 4. Compare to blueprint
      const blueprint = getBlueprintForExercise(detection.exercise);
      if (!blueprint) {
        // No blueprint — go straight to a minimal playback with raw pose
        setSession({
          videoUrl,
          poseFrames,
          comparisonResults: poseFrames.map((f, i) => ({
            t: f.t, index: i, phase: "unknown", angles: {}, jointStates: {}, deviations: {}
          })),
          blueprint: null,
          exerciseName: detection.exercise !== "unknown"
            ? (EXERCISE_NAMES[detection.exercise] || detection.exercise)
            : "Unknown Exercise",
        });
        setPhase("playback");
        return;
      }

      setPhase("comparing");
      setProgressLabel("Comparing to ideal form...");
      setProgress(50);
      const comparisonResults = compareToBlueprint(poseFrames, blueprint);
      setProgress(100);

      // 5. Generate report
      const rpt = generateReport(comparisonResults, blueprint);
      setReport(rpt);

      setSession({
        videoUrl,
        poseFrames,
        comparisonResults,
        blueprint,
        exerciseName: EXERCISE_NAMES[detection.exercise] || detection.exercise,
        exercise: detection.exercise,
        confidence: detection.confidence,
      });

      setPhase("playback");
    } catch (err) {
      console.error("Analysis error:", err);
      setPhase("idle");
    }
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const saveData = {
        exercise_id: session.exercise || "unknown",
        category: "strength",
        form_score_overall: report?.movementScore ?? 0,
        movement_score: report?.movementScore ?? 0,
        reps_detected: 0,
        alerts: [],
        duration_seconds: session.poseFrames.length / 10,
      };
      await base44.entities.FormSession.create(saveData);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
    setPhase("idle");
    setSession(null);
    setReport(null);
    setDetectedExercise(null);
  };

  const isAnalyzing = ["extracting", "detecting", "comparing"].includes(phase);

  if (phase === "playback" && session) {
    return (
      <UploadPlaybackScreen
        session={session}
        onBack={() => { setPhase("idle"); setSession(null); }}
        onDone={() => setPhase("report")}
      />
    );
  }

  if (phase === "report" && report && session) {
    return (
      <AfterActionReport
        report={report}
        session={session}
        saving={saving}
        onSave={handleSave}
        onReplay={() => setPhase("playback")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <a
            href={createPageUrl("FormCheck")}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </a>
          <div className="flex-1">
            <h1
              className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Upload Analysis
            </h1>
            <p
              className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Compare to ideal form blueprint
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Upload zone */}
        <UploadZone
          onFile={handleFile}
          analyzing={isAnalyzing}
          progress={progress}
          progressLabel={progressLabel}
        />

        {/* Detected exercise badge */}
        {detectedExercise && !isAnalyzing && (
          <ExerciseBadge
            exercise={detectedExercise.exercise}
            confidence={detectedExercise.confidence}
          />
        )}

        {/* Info cards */}
        {!isAnalyzing && (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: "🎥", label: "10 fps", sub: "Frame rate" },
              { icon: "🦴", label: "33 pts", sub: "Pose landmarks" },
              { icon: "📐", label: "Blueprint", sub: "Form comparison" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center space-y-1"
              >
                <div className="text-xl">{item.icon}</div>
                <p className="text-xs font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{item.label}</p>
                <p className="text-[9px] text-white/30 uppercase tracking-wider">{item.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Supported exercises */}
        {!isAnalyzing && (
          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
            <p className="text-[10px] text-white/30 uppercase tracking-[0.25em]" style={{ fontFamily: "'DM Mono', monospace" }}>
              Auto-detected exercises
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "squat",    icon: "🏋️", name: "Squat" },
                { id: "deadlift", icon: "💪", name: "Deadlift" },
                { id: "pushup",   icon: "🫸", name: "Push-up" },
              ].map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8"
                >
                  <span className="text-sm">{ex.icon}</span>
                  <span className="text-[11px] text-white/60 font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {ex.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/20 leading-relaxed">
              Point camera at a side view for best detection accuracy.
              Squat, deadlift, and push-up blueprints are included.
            </p>
          </div>
        )}

        <p className="text-center text-[9px] text-white/10 tracking-wider pb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
          Video is processed entirely on-device · never sent to a server
        </p>
      </div>
    </div>
  );
}