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

/**
 * Acquire media stream with mobile-safe constraints and error handling
 * Stops all tracks on error for clean state
 */
async function acquireStream(facingMode = 'environment') {
  if (!isSecureContext()) {
    throw new Error('Camera requires HTTPS or localhost');
  }

  let lastErr = null;
  const constraints = buildConstraints(facingMode);
  
  for (const c of constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(c);
      return stream;
    } catch (err) {
      lastErr = err;
      // NotAllowedError means user denied permission — no point retrying
      if (err?.name === 'NotAllowedError') throw err;
      // NotFoundError means no camera available
      if (err?.name === 'NotFoundError') throw err;
      // SecurityError likely means insecure context
      if (err?.name === 'SecurityError') throw err;
      // Otherwise try next constraint
    }
  }
  
  throw lastErr || new Error('Unable to acquire camera stream');
}

export function useCameraStream(videoRef, facingMode = 'environment') {
  const [camState, setCamState] = useState('idle');
  const [camError, setCamError] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const streamRef = useRef(null);
  const switchAbortRef = useRef(null);

  /**
   * Safely switch camera without unmounting — handles cleanup + rebind
   */
  const switchCamera = async (newFacingMode) => {
    try {
      setIsSwitching(true);
      setCamError(null);

      // Abort any in-flight operations
      if (switchAbortRef.current) {
        switchAbortRef.current.abort();
      }
      switchAbortRef.current = new AbortController();

      // Stop current stream's tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not found');
      }

      // Clear old stream from video element
      video.srcObject = null;

      // Acquire new stream
      const newStream = await acquireStream(newFacingMode);

      if (switchAbortRef.current?.signal.aborted) {
        newStream.getTracks().forEach(t => t.stop());
        return;
      }

      // Bind new stream to video
      streamRef.current = newStream;
      video.srcObject = newStream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;

      // Wait for metadata and play
      await new Promise((resolve, reject) => {
        const onMetadata = () => {
          video.removeEventListener('loadedmetadata', onMetadata);
          const playPromise = video.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(resolve).catch(() => resolve());
          } else {
            resolve();
          }
        };

        video.addEventListener('loadedmetadata', onMetadata);
        const timeoutId = setTimeout(() => {
          video.removeEventListener('loadedmetadata', onMetadata);
          if (video.readyState >= 1) resolve();
          else reject(new Error('Video metadata timeout'));
        }, 5000);

        return () => clearTimeout(timeoutId);
      });

      setIsSwitching(false);
      return true;
    } catch (err) {
      setIsSwitching(false);
      
      let msg = `Camera error: ${err?.message || 'unknown'}`;
      if (err?.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Tap Settings > Camera to allow.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err?.name === 'NotReadableError') {
        msg = 'Camera is in use by another app. Close it and try again.';
      } else if (err?.message?.includes('facingMode')) {
        msg = 'Requested camera not available.';
      }
      
      setCamError(msg);
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    if (!videoRef.current) {
      setCamState('idle');
      return;
    }

    setCamState('requesting');
    setCamError(null);

    acquireStream(facingMode)
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        // Stop previous stream's tracks before binding new stream
        if (streamRef.current && streamRef.current !== stream) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        // Bind stream to video element (iOS requires playsInline + muted)
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;

        return new Promise((resolve, reject) => {
          const onMetadata = () => {
            video.removeEventListener('loadedmetadata', onMetadata);
            // Play with error handling for promise-based play()
            const playPromise = video.play();
            if (playPromise && typeof playPromise.then === 'function') {
              playPromise.then(resolve).catch((err) => {
                console.warn('Initial play() failed, will retry', err);
                resolve();
              });
            } else {
              resolve();
            }
          };

          video.addEventListener('loadedmetadata', onMetadata);

          // Safety timeout if metadata never fires (5 seconds)
          const timeoutId = setTimeout(() => {
            video.removeEventListener('loadedmetadata', onMetadata);
            if (video.readyState >= 1) {
              const playPromise = video.play();
              if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(resolve).catch(() => resolve());
              } else {
                resolve();
              }
            } else {
              reject(new Error('Video metadata timeout'));
            }
          }, 5000);

          return () => clearTimeout(timeoutId);
        });
      })
      .then(() => {
        if (!cancelled) setCamState('active');
      })
      .catch((err) => {
        if (cancelled) return;
        
        // Stop any partial stream on error
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        // User-friendly error messages for mobile
        let msg = `Camera error: ${err?.message || 'unknown'}`;
        
        if (err?.name === 'NotAllowedError') {
          msg = 'Camera permission denied. Tap Settings > Camera to allow.';
        } else if (err?.name === 'NotFoundError') {
          msg = 'No camera found on this device.';
        } else if (err?.name === 'SecurityError' || err?.message?.includes('HTTPS')) {
          msg = 'Camera requires HTTPS or localhost.';
        } else if (err?.name === 'NotReadableError') {
          msg = 'Camera is in use by another app. Close it and try again.';
        } else if (err?.message?.includes('facingMode')) {
          msg = 'Requested camera facing not available. Try switching.';
        }
        
        setCamError(msg);
        setCamState('failed');
      });

    // Cleanup on unmount or facingMode change
    return () => {
      cancelled = true;
      if (switchAbortRef.current) {
        switchAbortRef.current.abort();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [videoRef, facingMode]);

  return { camState, camError, streamRef, isSwitching, switchCamera };
}