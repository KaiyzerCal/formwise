/**
 * AXIS Compare — Two-state technique comparison surface
 * States: SOURCE_SELECTION → COMPARISON_VIEW
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, ChevronDown } from 'lucide-react';
import { COLORS, FONT } from '../components/bioneer/ui/DesignTokens';
import VideoPanel from '../components/bioneer/compare/VideoPanel';
import MetricRail from '../components/bioneer/compare/MetricRail';
import { useVideoPose } from '../components/bioneer/compare/useVideoPose';
import { useTechniqueComparison } from '../components/bioneer/compare/useTechniqueComparison';
import { getTechniqueDraft } from '../components/bioneer/technique/techniqueStorage';
import { REFERENCE_POSES } from '../components/bioneer/compare/referenceLibrary';
import ReferenceSkeletonPlayer from '../components/bioneer/compare/ReferenceSkeletonPlayer';
import ReferenceVideoPlayer from '../components/bioneer/compare/ReferenceVideoPlayer';
import ReferenceLibrarySelector from '../components/bioneer/compare/ReferenceLibrarySelector';
import { useComparisonReport } from '../components/bioneer/compare/useComparisonReport';
import CompareReportCard from '../components/bioneer/compare/CompareReportCard';
import AnalysisInsightsPanel from '../components/bioneer/compare/AnalysisInsightsPanel';
import { saveSession } from '../components/bioneer/data/unifiedSessionStore';
import SourceSelection from '../components/bioneer/technique/compare/SourceSelection';
import AxisComparePanel from '../components/bioneer/technique/compare/AxisComparePanel';

const SPEEDS = [0.25, 0.5, 1, 2];
function fmt(s) { if (!s || isNaN(s)) return '0:00'; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

export default function TechniqueCompare() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exerciseParam = searchParams.get('exercise') || '';

  // State machine
  const [viewState, setViewState] = useState('SOURCE_SELECTION');
  const [refMode, setRefMode] = useState('library'); // library | custom | self
  const [selectedRefId, setSelectedRefId] = useState('back_squat');
  const [customRefSrc, setCustomRefSrc] = useState(null);
  const [selfCompare, setSelfCompare] = useState(false);
  const [prevBestScore, setPrevBestScore] = useState(0);

  // Video ref from library
  const [videoRefRecord, setVideoRefRecord] = useState(null);

  // User clip
  const [userSrc, setUserSrc] = useState(null);

  // View toggles
  const [mode, setMode] = useState('sidebyside');
  const [showOverlay, setShowOverlay] = useState(true);
  const [showGuides, setShowGuides] = useState(false);
  const [showAlignment, setShowAlignment] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showTechnicalData, setShowTechnicalData] = useState(false);

  // Report
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { recordFrame, buildReport, resetReport } = useComparisonReport();
  const [analysisResult, setAnalysisResult] = useState(null);

  // Skeleton landmarks
  const [refSkelLandmarks, setRefSkelLandmarks] = useState(null);

  const videoLeftRef = useRef(null);
  const videoRightRef = useRef(null);
  const videoUrlRef = useRef(null);

  const selectedRef = REFERENCE_POSES[selectedRefId];
  const isLibrary = refMode === 'library';
  const isVideoRef = isLibrary && !!videoRefRecord?.video_url;
  const hasRef = isLibrary ? (!!videoRefRecord?.video_url || !!selectedRef) : !!customRefSrc;
  const hasRightVideo = !isLibrary || isVideoRef;

  // Pose analysis
  const { poseState: userPoseState, landmarks: userLandmarks } = useVideoPose({
    videoRef: videoLeftRef, isPlaying: playing, enabled: !!userSrc, id: 'user',
  });
  const { poseState: refPoseState, landmarks: refVideoLandmarks } = useVideoPose({
    videoRef: videoRightRef, isPlaying: playing && !isLibrary, enabled: !!customRefSrc && !isLibrary, id: 'ref',
  });
  const refLandmarks = isLibrary ? refSkelLandmarks : refVideoLandmarks;
  const refPoseStateResolved = isLibrary ? (refSkelLandmarks ? 'locked' : 'ready') : refPoseState;

  const { deviations, cues, score, userConf, refConf } = useTechniqueComparison({ userLandmarks, refLandmarks });

  // Record frames for report
  useEffect(() => {
    if (!playing || !deviations?.length) return;
    const phase = selectedRef?.frames ? (selectedRef.frames[0]?.phase ?? '') : '';
    recordFrame(deviations, phase);
  }, [deviations, playing, selectedRef, recordFrame]);

  // Playback
  const play = useCallback(() => { videoLeftRef.current?.play().catch(() => {}); if (hasRightVideo) videoRightRef.current?.play().catch(() => {}); setPlaying(true); }, [hasRightVideo]);
  const pause = useCallback(() => { videoLeftRef.current?.pause(); if (hasRightVideo) videoRightRef.current?.pause(); setPlaying(false); }, [hasRightVideo]);
  const seek = useCallback((t) => { if (videoLeftRef.current) videoLeftRef.current.currentTime = t; if (hasRightVideo && videoRightRef.current) videoRightRef.current.currentTime = t; setCurrentTime(t); }, [hasRightVideo]);
  const changeSpeed = useCallback((s) => { setSpeed(s); if (videoLeftRef.current) videoLeftRef.current.playbackRate = s; if (hasRightVideo && videoRightRef.current) videoRightRef.current.playbackRate = s; }, [hasRightVideo]);

  useEffect(() => { if (videoLeftRef.current) videoLeftRef.current.playbackRate = speed; if (hasRightVideo && videoRightRef.current) videoRightRef.current.playbackRate = speed; }, [userSrc, customRefSrc, speed, hasRightVideo]);
  useEffect(() => { return () => { if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current); }; }, []);

  // Draft import
  useEffect(() => {
    const draftId = searchParams.get('draft');
    if (!draftId) return;
    getTechniqueDraft(draftId).then(draft => {
      if (!draft) return;
      if (draft.videoBlob instanceof Blob) {
        if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
        const url = URL.createObjectURL(draft.videoBlob);
        videoUrlRef.current = url;
        setUserSrc(url);
      }
    }).catch(() => {});
  }, [searchParams]);

  // End session & report
  const handleEndSession = useCallback(() => {
    pause();
    const rpt = buildReport(selectedRef?.name ?? (customRefSrc ? 'Custom Reference' : 'Unknown'), isLibrary ? selectedRefId : 'custom');
    if (rpt) { setReportData(rpt); setShowReport(true); }
  }, [pause, buildReport, selectedRef, customRefSrc, isLibrary, selectedRefId]);

  const handleSaveReport = useCallback(async () => {
    if (!reportData) return;
    await saveSession({ id: `compare_${Date.now()}`, type: 'comparison', exercise_id: reportData.exerciseId, movement_name: reportData.exerciseName, form_score_overall: reportData.overallScore, comparison_report: reportData, started_at: reportData.generatedAt, session_status: 'complete' }).catch(() => {});
    setShowReport(false); resetReport();
  }, [reportData, resetReport]);

  // Source selection handlers
  const handleSelectLibrary = (refId) => {
    setSelectedRefId(refId); setRefMode('library'); setSelfCompare(false); setViewState('COMPARISON_VIEW');
  };
  const handleSelectUpload = (src) => {
    setCustomRefSrc(src); setRefMode('custom'); setSelfCompare(false); setViewState('COMPARISON_VIEW');
  };
  const handleSelectPrevBest = (videoUrl, bestScore) => {
    setCustomRefSrc(videoUrl); setRefMode('custom'); setSelfCompare(true); setPrevBestScore(bestScore); setViewState('COMPARISON_VIEW');
  };

  // SOURCE SELECTION view
  if (viewState === 'SOURCE_SELECTION') {
    return (
      <div style={{ height: '100%', overflowY: 'auto', background: COLORS.bg, fontFamily: FONT.mono }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={18} style={{ color: COLORS.textSecondary }} />
          </button>
          <h1 style={{ flex: 1, textAlign: 'center', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: COLORS.gold }}>
            AXIS COMPARE
          </h1>
          <div style={{ width: 26 }} />
        </div>
        <SourceSelection
          exerciseId={exerciseParam}
          exerciseName={exerciseParam?.replace(/_/g, ' ')}
          onSelectLibrary={handleSelectLibrary}
          onSelectUpload={handleSelectUpload}
          onSelectPrevBest={handleSelectPrevBest}
          onBack={() => navigate(-1)}
        />
      </div>
    );
  }

  // COMPARISON VIEW
  const sourceLabel = selfCompare ? 'vs Previous Best' : refMode === 'library' ? `vs ${selectedRef?.name || 'Library'}` : 'vs Upload';

  return (
    <div className="h-full flex flex-col relative" style={{ fontFamily: FONT.mono, background: COLORS.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, flexShrink: 0 }}>
        <button onClick={() => setViewState('SOURCE_SELECTION')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronLeft size={16} style={{ color: COLORS.textSecondary }} />
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.textSecondary }}>
          {sourceLabel}
        </span>
        <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative' }}>
          <Settings size={14} style={{ color: showSettings ? COLORS.gold : COLORS.textTertiary }} />
        </button>
        {showSettings && (
          <div style={{ position: 'absolute', top: 40, right: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ToggleBtn label="Overlay" active={showOverlay} onClick={() => setShowOverlay(v => !v)} />
            <ToggleBtn label="Guides" active={showGuides} onClick={() => setShowGuides(v => !v)} />
            <ToggleBtn label="Alignment" active={showAlignment} onClick={() => setShowAlignment(v => !v)} />
            <div style={{ height: 1, background: COLORS.border }} />
            <ToggleBtn label="Side by Side" active={mode === 'sidebyside'} onClick={() => setMode('sidebyside')} />
            <ToggleBtn label="Overlay" active={mode === 'overlay'} onClick={() => setMode('overlay')} />
          </div>
        )}
      </div>

      {/* Video Area */}
      <div className="flex-1 flex overflow-hidden" style={{ background: '#000', minHeight: 0 }}>
        {!userSrc ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 10, color: COLORS.textTertiary }}>Upload your clip to begin comparison</p>
            <label style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 8, padding: '10px 20px', fontSize: 9, color: COLORS.gold, cursor: 'pointer', fontFamily: FONT.mono, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Upload Video
              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setUserSrc(URL.createObjectURL(f)); }} />
            </label>
          </div>
        ) : mode === 'sidebyside' ? (
          <>
            <div className="h-full border-r relative" style={{ width: '50%', borderColor: COLORS.border }}>
              <VideoPanel videoRef={videoLeftRef} src={userSrc} label="YOUR MOVEMENT" labelColor={COLORS.correct}
                muted={false} showOverlay={showOverlay} showGuides={showGuides} showAlignment={showAlignment}
                isPlaying={playing} landmarks={userLandmarks}
                onLoaded={() => { if (videoLeftRef.current) setDuration(videoLeftRef.current.duration); }}
                onTimeUpdate={() => { if (videoLeftRef.current) setCurrentTime(videoLeftRef.current.currentTime); }}
              />
            </div>
            <div className="h-full relative" style={{ width: '50%' }}>
              {isVideoRef ? (
                <ReferenceVideoPlayer videoUrl={videoRefRecord.video_url} keypoints={videoRefRecord.keypoints_per_frame}
                  fps={videoRefRecord.fps || 30} phases={videoRefRecord.key_phases || []}
                  label={videoRefRecord.exercise_name || 'IDEAL FORM'} showGuides={showGuides} isPlaying={playing}
                  videoRef={videoRightRef} onLandmarksChange={setRefSkelLandmarks} />
              ) : isLibrary ? (
                <ReferenceSkeletonPlayer frames={selectedRef?.frames} label={selectedRef?.name} onLandmarksChange={setRefSkelLandmarks} />
              ) : (
                <VideoPanel videoRef={videoRightRef} src={customRefSrc} label={selfCompare ? 'YOUR BEST' : 'REFERENCE'} labelColor={COLORS.gold}
                  muted={true} showOverlay={showOverlay} showGuides={showGuides} showAlignment={showAlignment}
                  isPlaying={playing} landmarks={refVideoLandmarks} />
              )}
            </div>
          </>
        ) : (
          <div className="relative w-full h-full">
            <div className="absolute inset-0">
              <VideoPanel videoRef={videoLeftRef} src={userSrc} label="YOUR MOVEMENT" labelColor={COLORS.correct}
                muted={false} showOverlay={showOverlay} showGuides={showGuides} showAlignment={showAlignment}
                isPlaying={playing} landmarks={userLandmarks}
                onLoaded={() => { if (videoLeftRef.current) setDuration(videoLeftRef.current.duration); }}
                onTimeUpdate={() => { if (videoLeftRef.current) setCurrentTime(videoLeftRef.current.currentTime); }}
              />
            </div>
            <div className="absolute bottom-20 right-4 z-20 rounded-xl overflow-hidden border shadow-2xl"
              style={{ width: 160, height: 120, borderColor: COLORS.goldBorder }}>
              {isVideoRef ? (
                <ReferenceVideoPlayer videoUrl={videoRefRecord.video_url} keypoints={videoRefRecord.keypoints_per_frame}
                  fps={videoRefRecord.fps || 30} phases={videoRefRecord.key_phases || []} label="" showGuides={false}
                  isPlaying={playing} videoRef={videoRightRef} onLandmarksChange={setRefSkelLandmarks} />
              ) : isLibrary ? (
                <ReferenceSkeletonPlayer frames={selectedRef?.frames} label="" onLandmarksChange={setRefSkelLandmarks} />
              ) : (
                <VideoPanel videoRef={videoRightRef} src={customRefSrc} label="REF" labelColor={COLORS.gold}
                  muted={true} showOverlay={false} showGuides={false} showAlignment={false}
                  isPlaying={playing} landmarks={refVideoLandmarks} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* AXIS Compare Panel */}
      {userSrc && (
        <AxisComparePanel
          sessionId={searchParams.get('draft') || 'compare'}
          refId={isLibrary ? selectedRefId : 'custom'}
          exerciseName={exerciseParam?.replace(/_/g, ' ') || selectedRef?.name || 'exercise'}
          formScore={score || 0}
          topFault={cues?.[0]?.joint || ''}
          refType={selfCompare ? 'their previous best' : isLibrary ? 'library reference' : 'uploaded reference'}
          prevScore={selfCompare ? prevBestScore : null}
          selfCompare={selfCompare}
        />
      )}

      {/* Technical Data Disclosure */}
      {userSrc && (
        <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={() => setShowTechnicalData(!showTechnicalData)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', background: COLORS.surface, border: 'none', cursor: 'pointer',
            fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.textTertiary, fontFamily: FONT.mono,
          }}>
            Technical Data
            <ChevronDown size={12} style={{ transform: showTechnicalData ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: COLORS.textTertiary }} />
          </button>
          {showTechnicalData && (
            <div style={{ maxHeight: 300, overflowY: 'auto', borderTop: `1px solid ${COLORS.border}` }}>
              {analysisResult ? (
                <AnalysisInsightsPanel analysis={analysisResult} />
              ) : (
                <MetricRail userPoseState={userPoseState} refPoseState={refPoseStateResolved}
                  deviations={deviations} cues={cues} score={score} userConf={userConf} refConf={refConf}
                  isPlaying={playing} hasRef={hasRef} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Playback Bar */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${COLORS.border}`, background: COLORS.surface, padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={playing ? pause : play} disabled={!userSrc} style={{
            background: COLORS.gold, color: '#000', border: 'none', borderRadius: 4,
            padding: '6px 16px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: userSrc ? 'pointer' : 'default', opacity: userSrc ? 1 : 0.3, fontFamily: FONT.mono,
          }}>
            {playing ? 'Pause' : 'Play'}
          </button>
          {(playing || deviations?.some(d => d.diff !== null)) && (
            <button onClick={handleEndSession} style={{
              background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, borderRadius: 4,
              padding: '6px 12px', fontSize: 9, fontWeight: 700, color: COLORS.gold, cursor: 'pointer', fontFamily: FONT.mono,
            }}>
              End + Report
            </button>
          )}
          <span style={{ flex: 1, textAlign: 'center', fontSize: 9, color: COLORS.textTertiary }}>{fmt(currentTime)} / {fmt(duration)}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {SPEEDS.map(s => (
              <button key={s} onClick={() => changeSpeed(s)} style={{
                background: speed === s ? COLORS.goldDim : 'transparent',
                border: `1px solid ${speed === s ? COLORS.goldBorder : COLORS.border}`,
                borderRadius: 4, padding: '4px 8px', fontSize: 8, cursor: 'pointer',
                color: speed === s ? COLORS.gold : COLORS.textTertiary, fontFamily: FONT.mono,
              }}>
                {s}×
              </button>
            ))}
          </div>
          <ToggleBtn label={mode === 'sidebyside' ? 'SBS' : 'OVR'} active={true} onClick={() => setMode(m => m === 'sidebyside' ? 'overlay' : 'sidebyside')} />
        </div>
      </div>

      {/* Report Overlay */}
      {showReport && <CompareReportCard report={reportData} onDismiss={() => { setShowReport(false); resetReport(); }} onSave={handleSaveReport} />}
    </div>
  );
}

function ToggleBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 8px', borderRadius: 4, fontSize: 8, cursor: 'pointer', fontFamily: FONT.mono,
      background: active ? COLORS.goldDim : 'transparent',
      border: `1px solid ${active ? COLORS.goldBorder : COLORS.border}`,
      color: active ? COLORS.gold : COLORS.textTertiary,
    }}>
      {label}
    </button>
  );
}