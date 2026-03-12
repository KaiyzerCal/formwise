/**
 * useCameraStream.js
 * Responsible ONLY for camera access and video stream.
 * States: idle | requesting | active | failed
 */
import { useEffect, useRef, useState } from 'react';

export function useCameraStream(videoRef) {
  const [camState, setCamState]   = useState('idle');
  const [camError, setCamError]   = useState(null);
  const streamRef                 = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setCamState('requesting');
    setCamError(null);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          return video.play();
        }
      })
      .then(() => {
        if (!cancelled) setCamState('active');
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and retry.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err?.message || 'unknown'}`;
        setCamError(msg);
        setCamState('failed');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, [videoRef]);

  return { camState, camError };
}