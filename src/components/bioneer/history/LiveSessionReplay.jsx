/**
 * LiveSessionReplay — video replay for saved live (strength/sports) sessions.
 * Uses actual recorded video from IndexedDB; skeleton overlay optional if poseFrames present.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, X, Eye, EyeOff } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { getSessionVideoUrl } from '../data/liveVideoStorage';
import { useVideoPose } from '../compare/useVideoPose';

// Skeleton rendering from VideoPanel
const POSE_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],  // shoulders/arms
  [11,23],[12,24],[23,24],                   // torso
  [23,25],[25,27],[24,26],[26,28],           // legs
  [27,29],[27,31],[28,30],[28,32],           // ankles/feet
];

const KEY_JOINTS = new Set([11,12,13,14,15,16,23,24,25,26,27,28]);

function drawSkeleton(ctx, lm, w, h, accentColor) {
  if (!lm || !lm.length) return;
  ctx.save();

  // Connectors
  POSE_CONNECTIONS.forEach(([a, b]) => {
    const pa = lm[a], pb = lm[b];
    if (!pa || !pb || pa.visibility < 0.3 || pb.visibility < 0.3) return;
    const alpha = Math.min(pa.visibility, pb.visibility);
    ctx.strokeStyle = `rgba(255,255,255,${(alpha * 0.65).toFixed(2)})`;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  });

  // Joints
  lm.forEach((p, i) => {
    if (!p || p.visibility < 0.35) return;
    const x = p.x * w, y = p.y * h;
    const isKey = KEY_JOINTS.has(i);
    const radius = isKey ? 5 : 3;
    const color  = isKey ? accentColor : 'rgba(255,255,255,0.6)';

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = p.visibility;
    ctx.fill();

    if (isKey) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 2.5, 0, Math.PI * 2);
      ctx.strokeStyle = `${accentColor}60`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 1;
  ctx.restore();
}

export default function LiveSessionReplay({ session, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const [videoUrl, setVideoUrl]   = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Pose detection
  const { landmarks } = useVideoPose({
    videoRef, isPlaying, enabled: !!videoUrl, id: 'replay',
  });

  // Prefer in-memory videoSrc (object URL already created), fallback to IndexedDB
  useEffect(() => {
    let revoke = null;
    const load = async () => {
      setLoading(true);
      setError(null);

      if (session.videoSrc) {
        setVideoUrl(session.videoSrc);
        setLoading(false);
        return;
      }

      const key = session.video_storage_key || session.session_id;
      if (!key) {
        setError('No video available for this session.');
        setLoading(false);
        return;
      }

      try {
        const url = await getSessionVideoUrl(key);
        if (!url) {
          setError('Video not found. It may not have been recorded or was cleared.');
          setLoading(false);
          return;
        }
        revoke = url;
        setVideoUrl(url);
      } catch (err) {
        setError('Failed to load video: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    load();

    return () => {
      // Only revoke if we created the URL (not if it was passed as prop)
      if (revoke && revoke !== session.videoSrc) {
        URL.revokeObjectURL(revoke);
      }
    };
  }, [session.session_id, session.video_storage_key, session.videoSrc]);

  const handlePlay = useCallback(() => {
    videoRef.current?.play();
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleSeek = useCallback((e) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  }, []);

  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const el = containerRef.current;
    if (!canvas || !el) return;
    const { width, height } = el.getBoundingClientRect();
    if (canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    syncCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;

    ctx.clearRect(0, 0, w, h);

    if (landmarks && showSkeleton) {
      drawSkeleton(ctx, landmarks, w, h, COLORS.gold);
    }
  }, [landmarks, showSkeleton, syncCanvas]);

  // Canvas RAF loop
  useEffect(() => {
    const loop = () => {
      draw();
      if (isPlaying) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, isPlaying]);

  // Redraw on landmark change
  useEffect(() => { draw(); }, [landmarks, draw]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { syncCanvas(); draw(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncCanvas, draw]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ fontFamily: FONT.mono }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
        <div>
          <h2 className="text-sm font-bold tracking-[0.1em] uppercase" style={{ color: COLORS.gold }}>
            {session.movement_name || session.exercise || 'Session Replay'}
          </h2>
          <p className="text-[9px] mt-0.5" style={{ color: COLORS.textTertiary }}>
            {session.started_at ? new Date(session.started_at).toLocaleDateString() : ''}
            {session.average_form_score ? ` · Score: ${session.average_form_score}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition">
          <X className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
        </button>
      </div>

      {/* Video area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-4 border-slate-600 border-t-yellow-400 rounded-full animate-spin" />
            <p className="text-[10px]" style={{ color: COLORS.textTertiary }}>Loading video…</p>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-xs text-center space-y-2 px-6">
            <p className="text-xs font-bold" style={{ color: '#EF4444' }}>Video unavailable</p>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textTertiary }}>{error}</p>
          </div>
        )}

        {!loading && !error && videoUrl && (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-contain"
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              playsInline
            />
            {/* Skeleton overlay canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <button
                  onClick={handlePlay}
                  className="p-4 rounded-full bg-black/50 pointer-events-auto"
                >
                  <Play className="w-8 h-8" style={{ color: COLORS.gold }} fill={COLORS.gold} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {!loading && !error && videoUrl && (
        <div className="border-t space-y-3 px-4 py-4" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <input
            type="range" min="0" max={duration || 1} step="0.1" value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 rounded-lg bg-gray-700 cursor-pointer"
            style={{ accentColor: COLORS.gold }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <button onClick={handlePause} className="p-2 rounded-lg hover:bg-white/10">
                  <Pause className="w-5 h-5" style={{ color: COLORS.gold }} />
                </button>
              ) : (
                <button onClick={handlePlay} className="p-2 rounded-lg hover:bg-white/10">
                  <Play className="w-5 h-5" style={{ color: COLORS.gold }} fill={COLORS.gold} />
                </button>
              )}
              <div className="w-px h-5" style={{ background: COLORS.border }} />
              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: showSkeleton ? COLORS.gold : COLORS.textTertiary }}
              >
                {showSkeleton ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
            </div>
            <span className="text-[10px]" style={{ color: COLORS.textTertiary }}>
              {fmt(currentTime)} / {fmt(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}