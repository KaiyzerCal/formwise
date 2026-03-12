/**
 * useCameraStream.js
 * Responsible ONLY for camera access and video stream.
 * States: idle | requesting | active | failed
 *
 * FIX: Falls back from environment camera → any camera → reduced resolution
 * FIX: Waits for video loadedmetadata before signalling 'active'
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// Stored preference for last selected camera facing
function getStoredCameraFacing() {
  try {
    const stored = localStorage.getItem('bioneer:cameraFacing');
    return stored === 'user' ? 'user' : 'environment';
  } catch {
    return 'environment';
  }
}

function setStoredCameraFacing(facing) {
  try {
    localStorage.setItem('bioneer:cameraFacing', facing);
  } catch {}
}

// Try to acquire stream with requested facingMode, fall back gracefully
async function acquireStream(desiredFacing = 'environment') {
  const constraints = [
    { video: { facingMode: desiredFacing, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { facingMode: 'ideal', width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
    { video: true },
  ];

  let lastErr = null;
  for (const constraints_obj of constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints_obj);
      return stream;
    } catch (err) {
      lastErr = err;
      // NotAllowedError → no point retrying other constraints
      if (err?.name === 'NotAllowedError') throw err;
    }
  }
  throw lastErr;
}

export function useCameraStream(videoRef, cameraFacing = null) {
  const [camState, setCamState] = useState('idle');
  const [camError, setCamError] = useState(null);
  const [currentFacing, setCurrentFacing] = useState(() => cameraFacing || getStoredCameraFacing());
  const streamRef = useRef(null);
  const switchingRef = useRef(false);

  // Load initial preference if not provided
  useEffect(() => {
    if (cameraFacing) {
      setCurrentFacing(cameraFacing);
    }
  }, [cameraFacing]);

  const switchCamera = useCallback(async () => {
    if (switchingRef.current) return;
    switchingRef.current = true;

    try {
      const newFacing = currentFacing === 'user' ? 'environment' : 'user';
      const stream = await acquireStream(newFacing);
      
      // Stop old stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach(t => t.stop());
        throw new Error('Video element not available');
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        setTimeout(() => {
          if (video.readyState >= 1) resolve();
          else reject(new Error('Video metadata timeout'));
        }, 5000);
      });

      setCurrentFacing(newFacing);
      setStoredCameraFacing(newFacing);
      setCamState('active');
    } catch (err) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera permission denied.'
        : `Could not switch camera: ${err?.message || 'unknown'}`;
      setCamError(msg);
      setCamState('failed');
    } finally {
      switchingRef.current = false;
    }
  }, [currentFacing, videoRef]);

  useEffect(() => {
    let cancelled = false;
    setCamState('requesting');
    setCamError(null);

    acquireStream(currentFacing)
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
  }, [videoRef, currentFacing]);

  return { camState, camError, currentFacing, switchCamera };
}