/**
 * useTechniqueExporter
 * Universal MP4/WebM export engine for Technique Studio and Freestyle Replay.
 * Composites video + skeleton overlay + coach annotations into a single video file.
 */

const MAX_WIDTH  = 1280;
const MAX_HEIGHT = 720;

/**
 * Pick best supported MIME type for MediaRecorder.
 */
function pickMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

/**
 * Clamp export canvas dimensions to MAX_WIDTH × MAX_HEIGHT.
 */
function clampSize(w, h) {
  if (w <= MAX_WIDTH && h <= MAX_HEIGHT) return { width: w, height: h };
  const ratioW = MAX_WIDTH  / w;
  const ratioH = MAX_HEIGHT / h;
  const ratio  = Math.min(ratioW, ratioH);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

/**
 * exportTechniqueVideo
 *
 * @param {object} opts
 * @param {HTMLVideoElement}  opts.videoElement   — source video
 * @param {HTMLCanvasElement} [opts.overlayCanvas] — live annotation/skeleton canvas (optional)
 * @param {function}          [opts.onProgress]   — called with 0–1 progress
 * @param {number}            [opts.fps]           — target fps (default 30)
 * @param {string}            [opts.filename]      — download filename
 * @returns {Promise<string>}  resolves with object URL of exported blob
 */
export async function exportTechniqueVideo({
  videoElement,
  overlayCanvas = null,
  onProgress = null,
  fps = 30,
  filename = null,
}) {
  if (!videoElement) throw new Error('Technique export requires a valid video element.');
  if (!videoElement.src && !videoElement.srcObject) throw new Error('Technique export requires valid video source.');

  const mimeType = pickMimeType();
  if (!mimeType) throw new Error('MediaRecorder is not supported in this browser.');

  const srcW = videoElement.videoWidth  || 640;
  const srcH = videoElement.videoHeight || 480;
  const { width, height } = clampSize(srcW, srcH);

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width  = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d');

  const stream   = exportCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks   = [];

  recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };

  const totalDuration = videoElement.duration || 0;

  // Seek to beginning and pause
  videoElement.pause();
  videoElement.currentTime = 0;

  // Wait for seek to complete
  await new Promise(resolve => {
    const onSeeked = () => { videoElement.removeEventListener('seeked', onSeeked); resolve(); };
    videoElement.addEventListener('seeked', onSeeked);
    // Guard: if already at 0, resolve immediately
    if (videoElement.currentTime === 0 && videoElement.readyState >= 2) resolve();
  });

  recorder.start(100); // collect chunks every 100ms

  // Play through video, compositing each frame
  videoElement.playbackRate = 1;
  videoElement.muted = true;
  videoElement.play();

  await new Promise((resolve, reject) => {
    let rafId = null;

    function renderFrame() {
      if (videoElement.ended || videoElement.paused) {
        if (rafId) cancelAnimationFrame(rafId);
        recorder.stop();
        resolve();
        return;
      }

      // Composite: video frame
      ctx.drawImage(videoElement, 0, 0, width, height);

      // Composite: overlay canvas (skeleton + annotations)
      if (overlayCanvas && overlayCanvas.width > 0 && overlayCanvas.height > 0) {
        ctx.drawImage(overlayCanvas, 0, 0, width, height);
      }

      // Progress callback
      if (onProgress && totalDuration > 0) {
        onProgress(Math.min(videoElement.currentTime / totalDuration, 1));
      }

      rafId = requestAnimationFrame(renderFrame);
    }

    rafId = requestAnimationFrame(renderFrame);

    // Safety: resolve when video ends
    videoElement.addEventListener('ended', () => {
      if (rafId) cancelAnimationFrame(rafId);
      recorder.stop();
      resolve();
    }, { once: true });

    videoElement.addEventListener('error', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      reject(new Error('Video playback error during export'));
    }, { once: true });
  });

  // Wait for recorder to finish flushing
  await new Promise(resolve => {
    recorder.onstop = resolve;
    // Guard: already stopped
    if (recorder.state === 'inactive') resolve();
  });

  const ext  = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  const type = mimeType.split(';')[0];
  const blob = new Blob(chunks, { type });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href     = url;
  a.download = filename || `bioneer-technique-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  return url;
}