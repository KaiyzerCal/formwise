/**
 * useSessionRecorder — captures video stream and pose frame data during freestyle sessions
 * Manages MediaRecorder lifecycle and pose frame buffering
 */
import { useRef, useCallback, useEffect, useState } from 'react';
import { createPoseFrame, createAngleFrame } from './sessionTypes';

export function useSessionRecorder(videoRef, canvasRef) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const poseFramesRef = useRef([]);
  const angleFramesRef = useRef([]);
  const frameCountRef = useRef(0);
  const recordingStartRef = useRef(null);
  const fpsRef = useRef(30);
  const frameIntervalRef = useRef(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);

  // Start recording from canvas (which has both video and skeleton overlay)
  const startRecording = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30);

    recorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 2500000,
    });

    chunksRef.current = [];
    poseFramesRef.current = [];
    angleFramesRef.current = [];
    frameCountRef.current = 0;
    recordingStartRef.current = Date.now();
    fpsRef.current = 30;
    frameIntervalRef.current = 1000 / fpsRef.current;

    recorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
    };

    recorderRef.current.start();
    setIsRecording(true);
  }, [canvasRef]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Capture pose frame data at target FPS
  const capturePoseFrame = useCallback((landmarks, angles, confidence) => {
    if (!isRecording || !recordingStartRef.current) return;

    frameCountRef.current++;
    const elapsed = Date.now() - recordingStartRef.current;

    // Adaptive FPS: if performance drops, reduce capture rate
    if (frameCountRef.current % Math.ceil(frameIntervalRef.current / 1000) === 0) {
      const frame = createPoseFrame({
        timestamp: elapsed,
        landmarks: landmarks || [],
        angles: angles || {},
        visibility: confidence || 0,
      });

      poseFramesRef.current.push(frame);

      // Aggregate angles for HUD display
      const angleFrame = createAngleFrame({
        timestamp: elapsed,
        kneeLeft: angles?.kneeLeft,
        kneeRight: angles?.kneeRight,
        hipLeft: angles?.hipLeft,
        hipRight: angles?.hipRight,
        elbowLeft: angles?.elbowLeft,
        elbowRight: angles?.elbowRight,
        shoulderLeft: angles?.shoulderLeft,
        shoulderRight: angles?.shoulderRight,
        spineAngle: angles?.spine,
      });

      angleFramesRef.current.push(angleFrame);
    }
  }, [isRecording]);

  // Adaptive FPS reducer on CPU stress
  const reduceFPS = useCallback(() => {
    fpsRef.current = Math.max(15, fpsRef.current - 5);
    frameIntervalRef.current = 1000 / fpsRef.current;
  }, []);

  // Get current session data
  const getSessionData = useCallback(() => {
    const duration = recordingStartRef.current
      ? (Date.now() - recordingStartRef.current) / 1000
      : 0;

    return {
      duration: Math.round(duration),
      videoBlob: recordedBlob,
      poseFrames: poseFramesRef.current,
      angleFrames: angleFramesRef.current,
    };
  }, [recordedBlob]);

  // Reset recording state
  const reset = useCallback(() => {
    recorderRef.current = null;
    chunksRef.current = [];
    poseFramesRef.current = [];
    angleFramesRef.current = [];
    frameCountRef.current = 0;
    recordingStartRef.current = null;
    setIsRecording(false);
    setRecordedBlob(null);
  }, []);

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    capturePoseFrame,
    getSessionData,
    reduceFPS,
    reset,
  };
}