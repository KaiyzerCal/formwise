import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COLORS, FONT } from '../components/bioneer/ui/DesignTokens';
import VideoPanel from '../components/bioneer/compare/VideoPanel';
import SourceSelector from '../components/bioneer/compare/SourceSelector';

const SPEEDS = [0.25, 0.5, 1, 2];

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function TechniqueCompare() {
  const [userSrc, setUserSrc]         = useState(null);
  const [userFilename, setUserFilename] = useState('');
  const [refClipId, setRefClipId]     = useState('');
  const [mode, setMode]               = useState('sidebyside');
  const [playing, setPlaying]         = useState(false);
  const [speed, setSpeed]             = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);

  const videoLeftRef  = useRef(null);
  const videoRightRef = useRef(null);

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

  const handleTimeUpdate = useCallback(() => {
    const v = videoLeftRef.current;
    if (v) setCurrentTime(v.currentTime);
  }, []);

  const handleLoaded = useCallback(() => {
    const v = videoLeftRef.current;
    if (v) setDuration(v.duration);
  }, []);

  // Keep playbackRate in sync when speed changes
  useEffect(() => {
    if (videoLeftRef.current)  videoLeftRef.current.playbackRate  = speed;
    if (videoRightRef.current) videoRightRef.current.playbackRate = speed;
  }, [speed, userSrc]);

  const handleUserUpload = (url, name) => {
    pause();
    setUserSrc(url);
    setUserFilename(name);
    setCurrentTime(0);
    setDuration(0);
  };

  const leftStyle  = mode === 'overlay' ? { width: '100%' } : { width: '50%' };
  const rightStyle = mode === 'overlay'
    ? { position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none' }
    : { width: '50%' };

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono, background: COLORS.bg }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
          Technique Compare
        </h1>
        <div className="flex items-center gap-1.5">
          {['sidebyside', 'overlay'].map(m => (
            <button key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded border text-[9px] tracking-[0.1em] uppercase"
              style={{
                background: mode === m ? COLORS.goldDim : 'transparent',
                borderColor: mode === m ? COLORS.goldBorder : COLORS.border,
                color: mode === m ? COLORS.gold : COLORS.textTertiary,
              }}>
              {m === 'sidebyside' ? 'Side by Side' : 'Overlay'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Source Controls ───────────────────────────────────── */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <SourceSelector
          userSrc={userSrc}
          userFilename={userFilename}
          refClipId={refClipId}
          onUserUpload={handleUserUpload}
          onRefSelect={setRefClipId}
        />
      </div>

      {/* ── Video Stage ──────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative flex" style={{ background: '#000' }}>
        {/* Left — user */}
        <div className="h-full border-r relative" style={{ ...leftStyle, borderColor: COLORS.border }}>
          <VideoPanel
            videoRef={videoLeftRef}
            src={userSrc}
            label="YOUR MOVEMENT"
            labelColor={COLORS.correct}
            muted={false}
            onLoaded={handleLoaded}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>

        {/* Right — reference */}
        <div className="h-full" style={rightStyle}>
          <VideoPanel
            videoRef={videoRightRef}
            src={null}
            label="IDEAL FORM"
            labelColor={COLORS.gold}
            muted={true}
          />
        </div>

        {/* Overlay legend */}
        {mode === 'overlay' && userSrc && (
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
            {[['YOU', COLORS.correct], ['REF', COLORS.gold]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5 px-2 py-1 rounded"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                <span className="text-[8px] tracking-[0.15em]" style={{ color: c, fontFamily: FONT.mono }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Playback Bar ─────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t px-4 py-3 space-y-2"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>

        {/* Scrubber */}
        <input
          type="range" min={0} max={duration || 1} step={0.033}
          value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          disabled={!userSrc}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: COLORS.gold, opacity: userSrc ? 1 : 0.3 }}
        />

        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Transport */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={playing ? pause : play}
              disabled={!userSrc}
              className="px-5 py-1.5 rounded text-[10px] tracking-[0.1em] uppercase font-bold disabled:opacity-30"
              style={{ background: COLORS.gold, color: '#000' }}>
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>

          {/* Time */}
          <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Speed */}
          <div className="flex items-center gap-1">
            {SPEEDS.map(s => (
              <button key={s}
                onClick={() => changeSpeed(s)}
                className="px-2 py-1 rounded border text-[9px]"
                style={{
                  background: speed === s ? COLORS.goldDim : 'transparent',
                  borderColor: speed === s ? COLORS.goldBorder : COLORS.border,
                  color: speed === s ? COLORS.gold : COLORS.textTertiary,
                }}>
                {s}×
              </button>
            ))}
          </div>

          {/* Future metrics note */}
          <span className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textMuted }}>
            Pose analysis · next pass
          </span>
        </div>
      </div>
    </div>
  );
}