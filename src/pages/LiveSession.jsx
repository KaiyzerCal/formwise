import React, { useState, useEffect, useRef } from "react";
import { COLORS, FONT } from "../components/bioneer/ui/DesignTokens";
import { COACHING_CUES, PHASE_SEQUENCE, LIVE_MOVEMENTS } from "../components/bioneer/ui/mockData";
import LiveCameraPanel from "../components/bioneer/ui/LiveCameraPanel";
import LiveSidebar from "../components/bioneer/ui/LiveSidebar";
import LiveBottomBar from "../components/bioneer/ui/LiveBottomBar";

export default function LiveSession() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cueIdx, setCueIdx] = useState(0);
  const [repScores, setRepScores] = useState([]);
  const [currentScore, setCurrentScore] = useState(0);
  const [movement, setMovement] = useState('Back Squat');
  const [coachLevel, setCoachLevel] = useState('Standard');
  const [audioOn, setAudioOn] = useState(true);
  const [cueVisible, setCueVisible] = useState(false);
  const [faults, setFaults] = useState([]);
  const [confidence, setConfidence] = useState(94);
  const timerRef = useRef(null);
  const phaseRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);
      phaseRef.current = setInterval(() => {
        setPhaseIdx(p => {
          const next = (p + 1) % PHASE_SEQUENCE.length;
          if (next === 0) {
            const score = 65 + Math.floor(Math.random() * 30);
            setReps(r => r + 1);
            setRepScores(s => [...s, score]);
            setCurrentScore(score);
            // Cycle cue
            const ci = Math.floor(Math.random() * COACHING_CUES.length);
            setCueIdx(ci);
            setCueVisible(true);
            setFaults(prev => {
              const cue = COACHING_CUES[ci];
              const existing = prev.find(f => f.text === cue.text);
              if (existing) return prev;
              return [...prev.slice(-4), { text: cue.text, severity: cue.severity, time: Date.now() }];
            });
            setTimeout(() => setCueVisible(false), 3000);
          }
          return next;
        });
        setConfidence(90 + Math.floor(Math.random() * 8));
      }, 800);
    } else {
      clearInterval(timerRef.current);
      clearInterval(phaseRef.current);
    }
    return () => { clearInterval(timerRef.current); clearInterval(phaseRef.current); };
  }, [running]);

  const handleStart = () => { setRunning(true); setElapsed(0); setReps(0); setRepScores([]); setFaults([]); setCurrentScore(0); };
  const handleStop = () => setRunning(false);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const currentCue = COACHING_CUES[cueIdx];
  const avgScore = repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : 0;

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono }}>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Camera Panel */}
        <div className="flex-1 relative min-h-[300px]">
          <LiveCameraPanel
            running={running}
            phase={PHASE_SEQUENCE[phaseIdx]}
            cue={currentCue}
            cueVisible={cueVisible}
            confidence={confidence}
          />
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-[280px] w-full border-l overflow-y-auto" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <LiveSidebar
            movement={movement}
            setMovement={setMovement}
            movements={LIVE_MOVEMENTS}
            reps={reps}
            timer={`${mm}:${ss}`}
            phase={PHASE_SEQUENCE[phaseIdx]}
            currentScore={currentScore}
            avgScore={avgScore}
            faults={faults}
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <LiveBottomBar
        running={running}
        onStart={handleStart}
        onStop={handleStop}
        coachLevel={coachLevel}
        setCoachLevel={setCoachLevel}
        audioOn={audioOn}
        setAudioOn={setAudioOn}
      />
    </div>
  );
}