import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COLORS, FONT } from '../components/bioneer/ui/DesignTokens';
import VideoPanel from '../components/bioneer/compare/VideoPanel';
import MetricRail from '../components/bioneer/compare/MetricRail';
import { useVideoPose } from '../components/bioneer/compare/useVideoPose';
import { useTechniqueComparison } from '../components/bioneer/compare/useTechniqueComparison';
import { getTechniqueDraft } from '../components/bioneer/technique/techniqueStorage';
import { REFERENCE_POSES, REFERENCE_EXERCISE_LIST } from '../components/bioneer/compare/referenceLibrary';
import ReferenceSkeletonPlayer from '../components/bioneer/compare/ReferenceSkeletonPlayer';
import { useComparisonReport } from '../components/bioneer/compare/useComparisonReport';
import CompareReportCard from '../components/bioneer/compare/CompareReportCard';
import { Upload, BookOpen, Film, Lock } from 'lucide-react';
import { saveSession } from '../components/bioneer/data/unifiedSessionStore';
import { useSubscription } from '../lib/subscriptionGate';
import { useNavigate } from 'react-router-dom';

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

function ModeTab({ label, icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-[0.12em] uppercase border-b-2 transition-colors"
      style={{
        borderColor:   active ? COLORS.gold    : 'transparent',
        color:         active ? COLORS.gold    : COLORS.textTertiary,
        background:    active ? COLORS.goldDim : 'transparent',
        fontFamily:    FONT.mono,
      }}>
      <Icon size={11} />
      {label}
    </button>
  );
}

export default function TechniqueCompare() {
  const [searchParams] = useSearchParams();
  const { canUseCompare } = useSubscription();
  const navigate = useNavigate();

  // ── Reference mode: 'library' | 'custom' ────────────────────────────────
  const [refMode,        setRefMode]        = useState('library');
  const [selectedRefId,  setSelectedRefId]  = useState('back_squat');

  // ── User clip ────────────────────────────────────────────────────────────
  const [userSrc,        setUserSrc]        = useState(null);
  const [userFilename,   setUserFilename]   = useState('');

  // ── Custom video ref clip ────────────────────────────────────────────────
  const [customRefSrc,   setCustomRefSrc]   = useState(null);

  // ── View toggles ─────────────────────────────────────────────────────────
  const [mode,           setMode]           = useState('sidebyside');
  const [showOverlay,    setShowOverlay]    = useState(true);
  const [showGuides,     setShowGuides]     = useState(false);
  const [showAlignment,  setShowAlignment]  = useState(false);
  const [playing,        setPlaying]        = useState(false);
  const [speed,          setSpeed]          = useState(1);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);

  // ── Import / error ────────────────────────────────────────────────────────
  const [sourceMode,     setSourceMode]     = useState('manual');
  const [importLabel,    setImportLabel]    = useState('');
  const [draftError,     setDraftError]     = useState(null);

  // ── Reference skeleton landmarks (updated by ReferenceSkeletonPlayer) ───
  const [refSkelLandmarks, setRefSkelLandmarks] = useState(null);

  // ── Report ────────────────────────────────────────────────────────────────
  const [showReport,     setShowReport]     = useState(false);
  const [reportData,     setReportData]     = useState(null);
  const { recordFrame, buildReport, resetReport } = useComparisonReport();

  const videoLeftRef  = useRef(null);
  const videoRightRef = useRef(null);
  const videoUrlRef   = useRef(null);
  const fileRef       = useRef(null);
  const customFileRef = useRef(null);

  const selectedRef   = REFERENCE_POSES[selectedRefId];
  const isLibrary     = refMode === 'library';
  const hasRef        = isLibrary ? !!selectedRef : !!customRefSrc;

  // ── Pose analysis — user video ───────────────────────────────────────────
  const { poseState: userPoseState, landmarks: userLandmarks } = useVideoPose({
    videoRef: videoLeftRef, isPlaying: playing, enabled: !!userSrc, id: 'user',
  });

  // ── Pose analysis — custom ref video (only when not in library mode) ─────
  const { poseState: refPoseState, landmarks: refVideoLandmarks } = useVideoPose({
    videoRef: videoRightRef, isPlaying: playing && !isLibrary, enabled: !!customRefSrc && !isLibrary, id: 'ref',
  });

  // In library mode, reference landmarks come from skeleton animation
  const refLandmarks = isLibrary ? refSkelLandmarks : refVideoLandmarks;
  const refPoseStateResolved = isLibrary
    ? (refSkelLandmarks ? 'locked' : 'ready')
    : refPoseState;

  // ── Comparison engine ─────────────────────────────────────────────────────
  const { deviations, cues, score, userConf, refConf } = useTechniqueComparison({
    userLandmarks, refLandmarks,
  });

  // Record frames for report while playing
  useEffect(() => {
    if (!playing || !deviations?.length) return;
    const phase = selectedRef?.frames
      ? (selectedRef.frames[0]?.phase ?? '') : '';
    recordFrame(deviations, phase);
  }, [deviations, playing, selectedRef, recordFrame]);

  // ── Playback controls ─────────────────────────────────────────────────────
  const play = useCallback(() => {
    videoLeftRef.current?.play().catch(() => {});
    if (!isLibrary) videoRightRef.current?.play().catch(() => {});
    setPlaying(true);
  }, [isLibrary]);

  const pause = useCallback(() => {
    videoLeftRef.current?.pause();
    if (!isLibrary) videoRightRef.current?.pause();
    setPlaying(false);
  }, [isLibrary]);

  const seek = useCallback((t) => {
    if (videoLeftRef.current)  videoLeftRef.current.currentTime = t;
    if (!isLibrary && videoRightRef.current) videoRightRef.current.currentTime = t;
    setCurrentTime(t);
  }, [isLibrary]);

  const changeSpeed = useCallback((s) => {
    setSpeed(s);
    if (videoLeftRef.current)  videoLeftRef.current.playbackRate = s;
    if (!isLibrary && videoRightRef.current) videoRightRef.current.playbackRate = s;
  }, [isLibrary]);

  useEffect(() => {
    if (videoLeftRef.current)  videoLeftRef.current.playbackRate  = speed;
    if (!isLibrary && videoRightRef.current) videoRightRef.current.playbackRate = speed;
  }, [userSrc, customRefSrc, speed, isLibrary]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  // ── File handlers ─────────────────────────────────────────────────────────
  const handleUserFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pause();
    setUserSrc(URL.createObjectURL(file));
    setUserFilename(file.name);
    setCurrentTime(0); setDuration(0);
  };

  const handleCustomRefFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pause();
    setCustomRefSrc(URL.createObjectURL(file));
    setCurrentTime(0);
  };

  // ── End session & generate report ────────────────────────────────────────
  const handleEndSession = useCallback(() => {
    pause();
    const rpt = buildReport(
      selectedRef?.name ?? customRefSrc ? 'Custom Reference' : 'Unknown',
      isLibrary ? selectedRefId : 'custom',
    );
    if (rpt) {
      setReportData(rpt);
      setShowReport(true);
    }
  }, [pause, buildReport, selectedRef, customRefSrc, isLibrary, selectedRefId]);

  const handleSaveReport = useCallback(async () => {
    if (!reportData) return;
    try {
      await saveSession({
        id: `compare_${Date.now()}`,
        type: 'comparison',
        exercise_id: reportData.exerciseId,
        movement_name: reportData.exerciseName,
        form_score_overall: reportData.overallScore,
        comparison_report: reportData,
        started_at: reportData.generatedAt,
        session_status: 'complete',
      });
    } catch (_) { /* non-critical */ }
    setShowReport(false);
    resetReport();
  }, [reportData, resetReport]);

  const handleDismissReport = () => {
    setShowReport(false);
    resetReport();
  };

  // ── Draft import from History ─────────────────────────────────────────────
  useEffect(() => {
    const draftId = searchParams.get('draft');
    if (!draftId) return;
    setDraftError(null);
    getTechniqueDraft(draftId)
      .then(draft => {
        if (!draft) { setDraftError('Draft not found.'); return; }
        if (draft.videoBlob instanceof Blob) {
          if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
          const url = URL.createObjectURL(draft.videoBlob);
          videoUrlRef.current = url;
          setUserSrc(url);
          setUserFilename(`Imported: ${draft.category || 'Freestyle'}`);
          setSourceMode('history-import');
          setImportLabel(`Imported from History • ${draft.category || 'Freestyle'}`);
          setCurrentTime(0); setDuration(0);
        } else {
          setDraftError('Imported video data is invalid.');
        }
      })
      .catch(() => setDraftError('Failed to load imported draft.'));
    return () => { if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current); };
  }, [searchParams]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!canUseCompare) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}` }}>
          <Lock size={22} style={{ color: COLORS.gold }} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
            Technique Compare
          </p>
          <p className="text-[10px] leading-relaxed max-w-xs" style={{ color: COLORS.textSecondary }}>
            Compare your movement against ideal reference skeletons. Available on PRO and ELITE plans.
          </p>
        </div>
        <button onClick={() => navigate('/Paywall')}
          className="px-8 py-3 rounded text-[10px] font-bold tracking-[0.15em] uppercase"
          style={{ background: COLORS.gold, color: '#000' }}>
          UPGRADE TO PRO
        </button>
        <button onClick={() => navigate(-1)}
          className="text-[9px] tracking-[0.1em] uppercase underline"
          style={{ color: COLORS.textTertiary }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative" style={{ fontFamily: FONT.mono, background: COLORS.bg }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xs tracking-[0.18em] uppercase font-bold" style={{ color: COLORS.gold }}>
              Technique Compare
            </h1>
            {importLabel && (
              <p className="text-[9px] tracking-[0.1em] mt-0.5" style={{ color: COLORS.textTertiary }}>
                {importLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <ToggleBtn label="Overlay"    active={showOverlay}   onClick={() => setShowOverlay(v => !v)} />
            <ToggleBtn label="Guides"     active={showGuides}    onClick={() => setShowGuides(v => !v)} />
            <ToggleBtn label="Alignment"  active={showAlignment} onClick={() => setShowAlignment(v => !v)} />
            <div className="w-px h-4 mx-1" style={{ background: COLORS.border }} />
            <ToggleBtn label="Side by Side" active={mode === 'sidebyside'} onClick={() => setMode('sidebyside')} />
            <ToggleBtn label="Overlay"      active={mode === 'overlay'}    onClick={() => setMode('overlay')} />
          </div>
        </div>
        {draftError && (
          <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-[9px]"
            style={{ color: '#EF4444' }}>
            {draftError}
          </div>
        )}
      </div>

      {/* ── Source Controls ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <div className="flex flex-col sm:flex-row gap-3 p-4">

          {/* User clip */}
          <div className="flex-1 space-y-2">
            <label className="text-[9px] tracking-[0.2em] uppercase block" style={{ color: COLORS.textTertiary }}>
              Your Clip
            </label>
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed"
              style={{
                borderColor: userSrc ? `${COLORS.correct}60` : COLORS.goldBorder,
                background:  userSrc ? `${COLORS.correct}10` : COLORS.goldDim,
              }}>
              <Upload size={14} strokeWidth={1.5} style={{ color: userSrc ? COLORS.correct : COLORS.gold, flexShrink: 0 }} />
              <span className="text-[10px] truncate text-left" style={{ color: userSrc ? COLORS.correct : COLORS.gold }}>
                {userFilename || 'Upload your video'}
              </span>
            </button>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUserFile} />
          </div>

          {/* Reference — mode tabs + selector */}
          <div className="flex-1 space-y-2">
            <label className="text-[9px] tracking-[0.2em] uppercase block" style={{ color: COLORS.textTertiary }}>
              Reference
            </label>

            {/* Mode tabs */}
            <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: COLORS.border }}>
              <ModeTab label="Library"      icon={BookOpen} active={refMode === 'library'} onClick={() => setRefMode('library')} />
              <ModeTab label="Custom Video" icon={Film}     active={refMode === 'custom'}  onClick={() => setRefMode('custom')} />
            </div>

            {/* Library selector */}
            {refMode === 'library' && (
              <select
                value={selectedRefId}
                onChange={e => setSelectedRefId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-[10px] appearance-none outline-none"
                style={{ background: COLORS.surface, borderColor: COLORS.borderLight, color: COLORS.textPrimary, fontFamily: FONT.mono }}>
                {REFERENCE_EXERCISE_LIST.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            )}

            {/* Custom video upload */}
            {refMode === 'custom' && (
              <>
                <button onClick={() => customFileRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed"
                  style={{
                    borderColor: customRefSrc ? `${COLORS.gold}60` : COLORS.border,
                    background:  customRefSrc ? COLORS.goldDim       : 'transparent',
                  }}>
                  <Film size={14} strokeWidth={1.5} style={{ color: customRefSrc ? COLORS.gold : COLORS.textTertiary, flexShrink: 0 }} />
                  <span className="text-[10px] truncate text-left" style={{ color: customRefSrc ? COLORS.gold : COLORS.textTertiary }}>
                    {customRefSrc ? 'Reference loaded' : 'Upload reference video'}
                  </span>
                </button>
                <input ref={customFileRef} type="file" accept="video/*" className="hidden" onChange={handleCustomRefFile} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex" style={{ minHeight: 0 }}>

        {/* Video Stage */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden" style={{ background: '#000', minHeight: 0 }}>

            {mode === 'sidebyside' ? (
              <>
                {/* Left — user video */}
                <div className="h-full border-r relative" style={{ width: '50%', borderColor: COLORS.border }}>
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

                {/* Right — library skeleton OR custom video */}
                <div className="h-full relative" style={{ width: '50%' }}>
                  {isLibrary ? (
                    <ReferenceSkeletonPlayer
                      frames={selectedRef?.frames}
                      label={selectedRef?.name}
                      onLandmarksChange={setRefSkelLandmarks}
                    />
                  ) : (
                    <VideoPanel
                      videoRef={videoRightRef} src={customRefSrc}
                      label="IDEAL FORM" labelColor={COLORS.gold}
                      muted={true} showOverlay={showOverlay}
                      showGuides={showGuides} showAlignment={showAlignment}
                      isPlaying={playing} landmarks={refVideoLandmarks}
                    />
                  )}
                </div>
              </>
            ) : (
              /* Overlay mode */
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
                  style={{ width: 160, height: 120, borderColor: COLORS.goldBorder }}>
                  {isLibrary ? (
                    <ReferenceSkeletonPlayer
                      frames={selectedRef?.frames}
                      label=""
                      onLandmarksChange={setRefSkelLandmarks}
                    />
                  ) : (
                    <VideoPanel
                      videoRef={videoRightRef} src={customRefSrc}
                      label="REF" labelColor={COLORS.gold}
                      muted={true} showOverlay={false}
                      showGuides={false} showAlignment={false}
                      isPlaying={playing} landmarks={refVideoLandmarks}
                    />
                  )}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={playing ? pause : play} disabled={!userSrc}
                  className="px-5 py-1.5 rounded text-[10px] tracking-[0.1em] uppercase font-bold disabled:opacity-30"
                  style={{ background: COLORS.gold, color: '#000' }}>
                  {playing ? 'Pause' : 'Play'}
                </button>
                {(playing || deviations?.some(d => d.diff !== null)) && (
                  <button onClick={handleEndSession}
                    className="px-4 py-1.5 rounded border text-[10px] tracking-[0.1em] uppercase font-bold"
                    style={{ borderColor: COLORS.goldBorder, color: COLORS.gold, background: COLORS.goldDim, fontFamily: FONT.mono }}>
                    End + Report
                  </button>
                )}
              </div>
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
            refPoseState={refPoseStateResolved}
            deviations={deviations}
            cues={cues}
            score={score}
            userConf={userConf}
            refConf={refConf}
            isPlaying={playing}
            hasRef={hasRef}
          />
        </div>
      </div>

      {/* ── Report Overlay ───────────────────────────────────────── */}
      {showReport && (
        <CompareReportCard
          report={reportData}
          onDismiss={handleDismissReport}
          onSave={handleSaveReport}
        />
      )}
    </div>
  );
}