/**
 * useVideoRecorder.js
 * Minimal MediaRecorder hook for live session video capture.
 *
 * - Starts recording from a MediaStream (from useCameraStream)
 * - Collects chunks in ref (no re-renders during recording)
 * - finalize() stops recorder and returns a Promise<Blob[]>
 *   resolving only after onstop fires (guarantees all chunks are flushed)
 */
import { useRef, useCallback } from 'react';
import { getBestMimeType } from '../data/persistRecordedSessionVideo';

export function useVideoRecorder() {
  const recorderRef      = useRef(null);
  const chunksRef        = useRef([]);
  const mimeTypeRef      = useRef('video/webm');
  const stopResolverRef  = useRef(null);

  /**
   * Start recording from a MediaStream.
   * Safe to call even if already recording — will no-op.
   */
  const startRecording = useCallback((stream) => {
    if (!stream || recorderRef.current) return;
    if (typeof MediaRecorder === 'undefined') {
      console.warn('[useVideoRecorder] MediaRecorder not supported');
      return;
    }

    const mimeType = getBestMimeType();
    mimeTypeRef.current = mimeType;
    chunksRef.current   = [];

    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      // Fallback without mimeType if the codec isn't accepted
      try {
        recorder = new MediaRecorder(stream);
        mimeTypeRef.current = recorder.mimeType || 'video/webm';
      } catch (err) {
        console.error('[useVideoRecorder] Cannot create MediaRecorder:', err);
        return;
      }
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      if (stopResolverRef.current) {
        stopResolverRef.current(chunksRef.current);
        stopResolverRef.current = null;
      }
    };

    recorder.onerror = (e) => {
      console.error('[useVideoRecorder] MediaRecorder error:', e);
    };

    recorderRef.current = recorder;
    recorder.start(1000); // collect a chunk every 1 s
  }, []);

  /**
   * Finalize recording.
   * Stops the MediaRecorder and returns a Promise<{chunks, mimeType}>.
   * Resolves only once onstop has fired, guaranteeing all chunks are available.
   */
  const finalizeRecording = useCallback(() => {
    const recorder = recorderRef.current;

    if (!recorder) {
      // No recorder — return empty
      return Promise.resolve({ chunks: [], mimeType: mimeTypeRef.current });
    }

    if (recorder.state === 'inactive') {
      // Already stopped — return what we have
      recorderRef.current = null;
      return Promise.resolve({ chunks: chunksRef.current, mimeType: mimeTypeRef.current });
    }

    return new Promise((resolve) => {
      stopResolverRef.current = (chunks) => {
        recorderRef.current = null;
        resolve({ chunks, mimeType: mimeTypeRef.current });
      };
      try {
        recorder.requestData(); // flush last partial chunk
        recorder.stop();
      } catch (err) {
        console.error('[useVideoRecorder] Error stopping recorder:', err);
        recorderRef.current = null;
        resolve({ chunks: chunksRef.current, mimeType: mimeTypeRef.current });
      }
    });
  }, []);

  return { startRecording, finalizeRecording };
}