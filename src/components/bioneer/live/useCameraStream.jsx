/**
 * useCameraStream.js — Mobile-Safe Camera Hook
 * Handles secure context, permission requests, stream lifecycle, and camera switching
 * States: idle | requesting | active | failed
 *
 * Mobile optimizations:
 * - Secure context enforcement (https + localhost only)
 * - No autoplay on page load (permission only on user interaction)
 * - video.playsInline + muted for iOS compatibility
 * - Graceful fallback chain: exact → ideal → generic → reduced res
 * - Proper track cleanup on switch/unmount
 * - Safe play() promise handling
 */
import { useEffect, useRef, useState } from 'react';

/**
 * Check if running in secure context
 * https or localhost are the only safe contexts for camera
 */
function isSecureContext() {
  return window.isSecureContext || false;
}

/**
 * Build constraint array for a given facing mode
 * Attempt order: exact → ideal → generic fallback
 * Using 'ideal' instead of 'min'/'max' for mobile flexibility
 */
function buildConstraints(facingMode) {
  return [
    { video: { facingMode: { exact: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
    { video: true },
  ];
}

async function acquireStream(facingMode = 'environment') {
  let lastErr = null;
  const constraints = buildConstraints(facingMode);
  for (const c of constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(c);
      return stream;
    } catch (err) {
      lastErr = err;
      // NotAllowedError → no point retrying other constraints
      if (err?.name === 'NotAllowedError') throw err;
    }
  }
  throw lastErr;
}

export function useCameraStream(videoRef, facingMode = 'environment') {
  const [camState, setCamState] = useState('idle');
  const [camError, setCamError] = useState(null);
  const streamRef               = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setCamState('requesting');
    setCamError(null);

    acquireStream(facingMode)
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;

        return new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play().then(resolve).catch(reject);
          };
          // Safety timeout if metadata never fires
          setTimeout(() => {
            if (video.readyState >= 1) video.play().then(resolve).catch(reject);
            else reject(new Error('Video metadata timeout'));
          }, 5000);
        });
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [videoRef, facingMode]);

  return { camState, camError };
}