/**
 * useCameraController — Reusable camera control hook for front/back camera support
 * Handles: stream acquisition, camera switching, mirroring, permission errors, fallback logic
 * 
 * Usage:
 *   const { camState, camError, cameraFacing, setCameraFacing, isMirrored, switchCamera } = useCameraController(videoRef);
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Constraint order: try front/back with ideal resolution, then fallback to any camera
const CAMERA_CONSTRAINTS = (facingMode) => [
  // Exact facing mode with ideal resolution
  {
    video: {
      facingMode: { exact: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  },
  // Ideal facing mode with fallback resolution
  {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  },
  // No facing constraint — use whatever camera is available
  {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  },
  // Final fallback: any camera
  { video: true }
];

async function acquireStream(facingMode) {
  const constraints = CAMERA_CONSTRAINTS(facingMode);
  let lastErr = null;

  for (const constraint of constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraint);
      return stream;
    } catch (err) {
      lastErr = err;
      // Permission denied — no point retrying other constraints
      if (err?.name === 'NotAllowedError') {
        throw err;
      }
      // Continue to next constraint if this one failed
    }
  }

  throw lastErr;
}

export function useCameraController(videoRef) {
  const [camState, setCamState] = useState('idle');
  const [camError, setCamError] = useState(null);
  const [cameraFacing, setCameraFacing] = useState(() => {
    // Restore last preference from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bioneer_cameraFacing') || 'environment';
    }
    return 'environment';
  });
  const [isSwitching, setIsSwitching] = useState(false);

  const streamRef = useRef(null);

  // Persist camera preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bioneer_cameraFacing', cameraFacing);
    }
  }, [cameraFacing]);

  // Initialize camera stream
  useEffect(() => {
    let cancelled = false;
    setCamState('requesting');
    setCamError(null);

    acquireStream(cameraFacing)
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

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
          // Safety timeout
          setTimeout(() => {
            if (video.readyState >= 1) {
              video.play().then(resolve).catch(reject);
            } else {
              reject(new Error('Video metadata timeout'));
            }
          }, 5000);
        });
      })
      .then(() => {
        if (!cancelled) {
          setCamState('active');
          setIsSwitching(false);
        }
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
        setIsSwitching(false);
      });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [videoRef, cameraFacing]);

  const switchCamera = useCallback(() => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setIsSwitching(true);
    setCameraFacing(newFacing);
  }, [cameraFacing]);

  // Front camera (user-facing) should be mirrored for display
  const isMirrored = cameraFacing === 'user';

  return {
    camState,
    camError,
    cameraFacing,
    setCameraFacing,
    isMirrored,
    isSwitching,
    switchCamera,
    streamRef,
  };
}