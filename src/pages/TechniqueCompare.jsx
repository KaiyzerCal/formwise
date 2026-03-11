import React, { useState, useRef, useMemo } from 'react';
import { COLORS, FONT } from '../components/bioneer/ui/DesignTokens';
import { useTechniqueCompare } from '../components/bioneer/compare/useTechniqueCompare';
import { getCompareProfile, COMPARE_PROFILES } from '../components/bioneer/compare/compareProfiles';
import { extractAngles } from '../components/bioneer/compare/poseUtils';
import { getReferenceClip } from '../components/bioneer/compare/SourceSelector';
import SourceSelector from '../components/bioneer/compare/SourceSelector';
import VideoPanel from '../components/bioneer/compare/VideoPanel';
import MetricRail from '../components/bioneer/compare/MetricRail';

const MOVEMENT_LIST = Object.entries(COMPARE_PROFILES).map(([id, p]) => ({ id, name: p.name }));
const SPEEDS = [0.25, 0.5, 1, 2];

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function TechniqueCompare() {
  const [selectedMovementId, setSelectedMovementId] = useState('back_squat');
  const [userClipSrc, setUserClipSrc]   = useState(null);
  const [showAngles, setShowAngles]     = useState(true);

  const profile = useMemo(() => getCompareProfile(selectedMovementId), [selectedMovementId]);
  const refClipSrc = getReferenceClip(selectedMovementId);

  const videoLeftRef  = useRef(null);
  const videoRightRef = useRef(null);

  const {
    loaded, playing, speed, currentTime, duration, compareMode,
    leftLandmarks, rightLandmarks, metrics, cues,
    poseReady, poseError,
    play, pause, seek, stepFrame, setPlaybackRate, setCompareMode,
    onLoadedLeft, onLoadedRight, onTimeUpdateLeft,
  } = useTechniqueCompare({ profile, videoLeftRef, videoRightRef });

  const leftAngles  = useMemo(
    () => leftLandmarks  ? extractAngles(leftLandmarks,  profile.keyAngles) : {},
    [leftLandmarks, profile]
  );
  const rightAngles = useMemo(
    () => rightLandmarks ? extractAngles(rightLandmarks, profile.keyAngles) : {},
    [rightLandmarks, profile]
  );

  const handleMovementChange = (id) => {
    setSelectedMovementId(id);
    setUserClipSrc(null);
  };

  const showSourceSelector = !userClipSrc;

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono, background: COLORS.bg }}>

      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xs tracking-[0.15em] uppercase font-bold" style={{ color: COLORS.gold }}>
            Technique Analysis
          </h1>
          <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
            {profile?.name || '—'}
          </span>
          {poseError && (
            <span className="text-[9px] px-2 py-0.5 rounded"
              style={{ background: `${COLORS.warning}20`, color: COLORS.warning }}>
              {poseError}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Angle toggle */}
          <button
            onClick={() => setShowAngles(v => !v)}
            className="px-3 py-1 rounded text-[9px] tracking-[0.1em] uppercase border"
            style={{
              background: showAngles ? COLORS.goldDim : 'transparent',
              borderColor: showAngles ? COLORS.goldBorder : COLORS.border,
              color: showAngles ? COLORS.gold : COLORS.textTertiary,
            }}>
            Angles
          </button>

          {/* Mode toggle */}
          {['sidebyside', 'overlay'].map(m => (
            <button key={m}
              onClick={() => setCompareMode(m)}
              className="px-3 py-1 rounded text-[9px] tracking-[0.1em] uppercase border"
              style={{
                background: compareMode === m ? COLORS.goldDim : 'transparent',
                borderColor: compareMode === m ? COLORS.goldBorder : COLORS.border,
                color: compareMode === m ? COLORS.gold : COLORS.textTertiary,
              }}>
              {m === 'sidebyside' ? 'Side by Side' : 'Overlay'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {showSourceSelector ? (
          <SourceSelector
            onUserClip={setUserClipSrc}
            onMovementChange={handleMovementChange}
            movements={MOVEMENT_LIST}
            selectedMovement={selectedMovementId}
          />
        ) : (
          <>
            {/* Compare Stage */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                {compareMode === 'sidebyside' ? (
                  <>
                    {/* User panel */}
                    <div className="flex-1 relative border-r" style={{ borderColor: COLORS.border }}>
                      <VideoPanel
                        videoRef={videoLeftRef}
                        src={userClipSrc}
                        label="YOUR MOVEMENT"
                        labelColor={COLORS.correct}
                        landmarks={leftLandmarks}
                        angles={leftAngles}
                        profile={profile}
                        showAngles={showAngles}
                        color={COLORS.correct}
                        onLoaded={onLoadedLeft}
                        onTimeUpdate={onTimeUpdateLeft}
                        playing={playing}
                        muted={false}
                      />
                    </div>

                    {/* Reference panel */}
                    <div className="flex-1 relative">
                      <VideoPanel
                        videoRef={videoRightRef}
                        src={refClipSrc}
                        label="IDEAL FORM"
                        labelColor={COLORS.gold}
                        landmarks={rightLandmarks}
                        angles={rightAngles}
                        profile={profile}
                        showAngles={showAngles}
                        color={COLORS.gold}
                        onLoaded={onLoadedRight}
                        playing={playing}
                        muted={true}
                      />
                    </div>
                  </>
                ) : (
                  /* Overlay mode — user video behind, ref skeleton on top */
                  <div className="flex-1 relative">
                    {/* Hidden reference video for pose analysis */}
                    <video
                      ref={videoRightRef}
                      src={refClipSrc}
                      className="hidden"
                      playsInline muted loop
                      onLoadedData={onLoadedRight}
                    />

                    {/* User video + both skeletons */}
                    <div className="absolute inset-0 flex gap-2 items-start px-3 pt-3 z-20 pointer-events-none">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS.correct }} />
                        <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.correct }}>You</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS.gold }} />
                        <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: COLORS.gold }}>Reference</span>
                      </div>
                    </div>

                    <VideoPanel
                      videoRef={videoLeftRef}
                      src={userClipSrc}
                      label=""
                      labelColor={COLORS.correct}
                      landmarks={leftLandmarks}
                      angles={leftAngles}
                      profile={profile}
                      showAngles={showAngles}
                      color={COLORS.correct}
                      onLoaded={onLoadedLeft}
                      onTimeUpdate={onTimeUpdateLeft}
                      playing={playing}
                      muted={false}
                    />

                    {/* Overlay reference skeleton via separate canvas — rendered by MetricRail-adjacent logic */}
                    {/* Reference landmarks are drawn at reduced alpha on same canvas if needed */}
                  </div>
                )}
              </div>

              {/* ── Playback bar ─────────────────────────────────────── */}
              <div className="flex-shrink-0 px-4 py-3 border-t space-y-2"
                style={{ borderColor: COLORS.border, background: COLORS.surface }}>

                {/* Scrubber */}
                <input
                  type="range" min={0} max={duration || 1} step={0.033}
                  value={currentTime}
                  onChange={e => seek(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: COLORS.gold }}
                />

                <div className="flex items-center justify-between flex-wrap gap-2">
                  {/* Transport controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => stepFrame(-1)}
                      className="px-2 py-1.5 rounded border text-[10px]"
                      style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                      {'◁'}
                    </button>
                    <button
                      onClick={playing ? pause : play}
                      className="px-4 py-1.5 rounded text-[10px] tracking-[0.1em] uppercase font-bold"
                      style={{ background: COLORS.gold, color: '#000' }}>
                      {playing ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={() => stepFrame(1)}
                      className="px-2 py-1.5 rounded border text-[10px]"
                      style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                      {'▷'}
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
                        onClick={() => setPlaybackRate(s)}
                        className="px-2 py-1 rounded text-[9px] border"
                        style={{
                          background: speed === s ? COLORS.goldDim : 'transparent',
                          borderColor: speed === s ? COLORS.goldBorder : COLORS.border,
                          color: speed === s ? COLORS.gold : COLORS.textTertiary,
                        }}>
                        {s}×
                      </button>
                    ))}
                  </div>

                  {/* Change clip */}
                  <button
                    onClick={() => setUserClipSrc(null)}
                    className="text-[9px] tracking-[0.1em] uppercase"
                    style={{ color: COLORS.textTertiary }}>
                    Change Clip
                  </button>
                </div>
              </div>
            </div>

            {/* ── Metric Rail ──────────────────────────────────────── */}
            <div className="w-[190px] flex-shrink-0 border-l" style={{ borderColor: COLORS.border }}>
              <MetricRail metrics={metrics} cues={cues} profile={profile} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}