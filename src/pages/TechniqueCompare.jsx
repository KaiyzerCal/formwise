import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COLORS, FONT } from '../components/bioneer/ui/DesignTokens';
import VideoPanel from '../components/bioneer/compare/VideoPanel';
import SourceSelector, { getRefUrl } from '../components/bioneer/compare/SourceSelector';
import MetricRail from '../components/bioneer/compare/MetricRail';
import { useVideoPose } from '../components/bioneer/compare/useVideoPose';
import { useTechniqueComparison } from '../components/bioneer/compare/useTechniqueComparison';
import { getTechniqueDraft } from '../components/bioneer/technique/techniqueStorage';

const SPEEDS = [0.25, 0.5, 1, 2];

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function ToggleBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1 rounded border text-[9px] tracking-[0.1em] uppercase"
      style={{
        background:  active ? COLORS.goldDim    : 'transparent',
        borderColor: active ? COLORS.goldBorder : COLORS.border,
        color:       active ? COLORS.gold       : COLORS.textTertiary,
        fontFamily:  FONT.mono,
      }}>
      {label}
    </button>
  );
}

export default function TechniqueCompare() {
  const [userSrc,       setUserSrc]       = useState(null);
  const [userFilename,  setUserFilename]  = useState('');
  const [refClipId,     setRefClipId]     = useState('');
  const [refSrc,        setRefSrc]        = useState(null);
  const [mode,          setMode]          = useState('sidebyside');
  const [showOverlay,   setShowOverlay]   = useState(true);
  const [showGuides,    setShowGuides]    = useState(false);
  const [showAlignment, setShowAlignment] = useState(false);
  const [playing,       setPlaying]       = useState(false);
  const [speed,         setSpeed]         = useState(1);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(0);

  const videoLeftRef  = useRef(null);
  const videoRightRef = useRef(null);

  // ── Dual pose analysis ───────────────────────────────────────────────────
  const { poseState: userPoseState, landmarks: userLandmarks } = useVideoPose({
    videoRef: videoLeftRef, isPlaying: playing, enabled: !!userSrc, id: 'user',
  });

  const { poseState: refPoseState, landmarks: refLandmarks } = useVideoPose({
    videoRef: videoRightRef, isPlaying: playing, enabled: !!refSrc, id: 'ref',
  });

  // ── Comparison engine ────────────────────────────────────────────────────
  const { deviations, cues, score, userConf, refConf } = useTechniqueComparison({
    userLandmarks, refLandmarks,
  });

  // ── Playback controls ────────────────────────────────────────────────────
  const play = useCallback(() => {
    videoLeftRef.current?.play().catch(() => {});
    videoRightRef.current?.play().catch(() => {});
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    videoLeftRef.current?.pause();
    videoRightRef.current?.pause();
    setPlaying(false);
  }, []);

  const seek = useCallback((t) => {
    if (videoLeftRef.current)  videoLeftRef.current.currentTime  = t;
    if (videoRightRef.current) videoRightRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const changeSpeed = useCallback((s) => {
    setSpeed(s);
    if (videoLeftRef.current)  videoLeftRef.current.playbackRate  = s;
    if (videoRightRef.current) videoRightRef.current.playbackRate = s;
  }, []);

  useEffect(() => {
    if (videoLeftRef.current)  videoLeftRef.current.playbackRate  = speed;
    if (videoRightRef.current) videoRightRef.current.playbackRate = speed;
  }, [userSrc, refSrc, speed]);

  const handleUserUpload = (url, name) => {
    pause(); setUserSrc(url); setUserFilename(name); setCurrentTime(0); setDuration(0);
  };

  const handleRefSelect = (id) => {
    setRefClipId(id);
    setRefSrc(getRefUrl(id));
    pause();
  };

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono, background: COLORS.bg }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0 flex-wrap gap-2"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
          Technique Compare
        </h1>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ToggleBtn label="Overlay"   active={showOverlay}   onClick={() => setShowOverlay(v => !v)} />
          <ToggleBtn label="Guides"    active={showGuides}    onClick={() => setShowGuides(v => !v)} />
          <ToggleBtn label="Alignment" active={showAlignment} onClick={() => setShowAlignment(v => !v)} />
          <div className="w-px h-4 mx-1" style={{ background: COLORS.border }} />
          <ToggleBtn label="Side by Side" active={mode === 'sidebyside'} onClick={() => setMode('sidebyside')} />
          <ToggleBtn label="Overlay"      active={mode === 'overlay'}    onClick={() => setMode('overlay')} />
        </div>
      </div>

      {/* ── Source Controls ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <SourceSelector
          userSrc={userSrc} userFilename={userFilename} refClipId={refClipId}
          onUserUpload={handleUserUpload} onRefSelect={handleRefSelect}
        />
      </div>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>

        {/* Video Stage */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden" style={{ background: '#000', minHeight: 0 }}>

            {mode === 'sidebyside' ? (
              <>
                <div className="h-full border-r" style={{ width: '50%', borderColor: COLORS.border }}>
                  <VideoPanel
                    videoRef={videoLeftRef} src={userSrc}
                    label="YOUR MOVEMENT" labelColor={COLORS.correct}
                    muted={false} showOverlay={showOverlay}
                    showGuides={showGuides} showAlignment={showAlignment}
                    isPlaying={playing} landmarks={userLandmarks}
                    onLoaded={() => { const v = videoLeftRef.current; if (v) setDuration(v.duration); }}
                    onTimeUpdate={() => { const v = videoLeftRef.current; if (v) setCurrentTime(v.currentTime); }}
                  />
                </div>
                <div className="h-full" style={{ width: '50%' }}>
                  <VideoPanel
                    videoRef={videoRightRef} src={refSrc}
                    label="IDEAL FORM" labelColor={COLORS.gold}
                    muted={true} showOverlay={showOverlay}
                    showGuides={showGuides} showAlignment={showAlignment}
                    isPlaying={playing} landmarks={refLandmarks}
                  />
                </div>
              </>
            ) : (
              <div className="relative w-full h-full">
                <div className="absolute inset-0">
                  <VideoPanel
                    videoRef={videoLeftRef} src={userSrc}
                    label="YOUR MOVEMENT" labelColor={COLORS.correct}
                    muted={false} showOverlay={showOverlay}
                    showGuides={showGuides} showAlignment={showAlignment}
                    isPlaying={playing} landmarks={userLandmarks}
                    onLoaded={() => { const v = videoLeftRef.current; if (v) setDuration(v.duration); }}
                    onTimeUpdate={() => { const v = videoLeftRef.current; if (v) setCurrentTime(v.currentTime); }}
                  />
                </div>
                {/* PiP reference */}
                <div className="absolute bottom-20 right-4 z-20 rounded-xl overflow-hidden border shadow-2xl"
                  style={{ width: 160, height: 100, borderColor: COLORS.goldBorder }}>
                  <VideoPanel
                    videoRef={videoRightRef} src={refSrc}
                    label="REF" labelColor={COLORS.gold}
                    muted={true} showOverlay={false}
                    showGuides={false} showAlignment={false}
                    isPlaying={playing} landmarks={refLandmarks}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Playback Bar ─────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t px-4 py-3 space-y-2"
            style={{ borderColor: COLORS.border, background: COLORS.surface }}>
            <input
              type="range" min={0} max={duration || 1} step={0.033}
              value={currentTime}
              onChange={e => seek(Number(e.target.value))}
              disabled={!userSrc}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: COLORS.gold, opacity: userSrc ? 1 : 0.3 }}
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={playing ? pause : play} disabled={!userSrc}
                className="px-5 py-1.5 rounded text-[10px] tracking-[0.1em] uppercase font-bold disabled:opacity-30"
                style={{ background: COLORS.gold, color: '#000' }}>
                {playing ? 'Pause' : 'Play'}
              </button>
              <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
                {fmt(currentTime)} / {fmt(duration)}
              </span>
              <div className="flex items-center gap-1">
                {SPEEDS.map(s => (
                  <button key={s} onClick={() => changeSpeed(s)}
                    className="px-2 py-1 rounded border text-[9px]"
                    style={{
                      background:  speed === s ? COLORS.goldDim    : 'transparent',
                      borderColor: speed === s ? COLORS.goldBorder : COLORS.border,
                      color:       speed === s ? COLORS.gold       : COLORS.textTertiary,
                    }}>
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Metric Rail ─────────────────────────────────────────── */}
        <div className="w-[200px] flex-shrink-0 border-l hidden md:block" style={{ borderColor: COLORS.border }}>
          <MetricRail
            userPoseState={userPoseState}
            refPoseState={refPoseState}
            deviations={deviations}
            cues={cues}
            score={score}
            userConf={userConf}
            refConf={refConf}
            isPlaying={playing}
            hasRef={!!refSrc}
          />
        </div>
      </div>
    </div>
  );
}