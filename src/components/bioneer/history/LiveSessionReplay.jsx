/**
 * LiveSessionReplay — video replay for saved live (strength/sports) sessions.
 * Uses actual recorded video from IndexedDB; skeleton overlay optional if poseFrames present.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { COLORS, FONT } from '../ui/DesignTokens';
import { getSessionVideoUrl } from '../data/liveVideoStorage';

export default function LiveSessionReplay({ session, onClose }) {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl]   = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

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
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
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
              className="w-full h-full object-contain"
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              playsInline
            />
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
            <div className="flex items-center gap-3">
              {isPlaying ? (
                <button onClick={handlePause} className="p-2 rounded-lg hover:bg-white/10">
                  <Pause className="w-5 h-5" style={{ color: COLORS.gold }} />
                </button>
              ) : (
                <button onClick={handlePlay} className="p-2 rounded-lg hover:bg-white/10">
                  <Play className="w-5 h-5" style={{ color: COLORS.gold }} fill={COLORS.gold} />
                </button>
              )}
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