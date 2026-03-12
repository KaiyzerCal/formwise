/**
 * Technique Export Renderer
 * Handles export formats: JSON, snapshot PNG, and fallback package
 * Prepared structure for future MP4 rendering via backend service
 */

export class TechniqueExportRenderer {
  constructor(session, options = {}) {
    this.session = session;
    this.options = {
      includeAnnotations: true,
      includeOverlay: true,
      format: 'package', // 'json' | 'png_snapshot' | 'package'
      ...options,
    };
  }

  /**
   * Export as JSON metadata package
   * Contains all session data, annotations, metadata for archival or re-import
   */
  async exportAsJSON() {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      session: {
        id: this.session.id,
        createdAt: this.session.createdAt,
        sourceType: this.session.sourceType,
        category: this.session.derived.category,
        movementName: this.session.derived.movementName,
      },
      video: {
        width: this.session.video.width,
        height: this.session.video.height,
        fps: this.session.video.fps,
        durationMs: this.session.video.durationMs,
      },
      pose: {
        frameCount: this.session.pose.frames.length,
        confidenceSummary: this.session.pose.confidenceSummary,
        jointsTracked: this.session.pose.jointsTracked,
      },
      annotations: this.session.annotations || [],
      metadata: {
        athleteName: this.session.athleteName || '',
        coachNotes: this.session.coachNotes || '',
        tags: this.session.selectedTags || [],
      },
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    return this.downloadFile(jsonStr, 'application/json', `technique-${this.session.id}.json`);
  }

  /**
   * Export current frame as PNG snapshot with annotations overlay
   */
  async exportAsSnapshot(videoRef, canvasRef, frameIndex) {
    if (!canvasRef?.current) {
      throw new Error('Canvas reference required for snapshot export');
    }

    const canvas = canvasRef.current;

    // Create a new canvas for export (higher DPI simulation)
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const ctx = exportCanvas.getContext('2d');

    // Copy current frame from display canvas
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    // Convert to PNG blob
    return new Promise((resolve, reject) => {
      exportCanvas.toBlob(
        blob => {
          this.downloadFile(blob, 'image/png', `snapshot-${this.session.id}-frame${frameIndex}.png`);
          resolve(blob);
        },
        'image/png',
        0.95
      );
    });
  }

  /**
   * Export as a complete session package (ZIP-like structure via JSON)
   * Includes:
   * - Metadata JSON
   * - Annotation JSON
   * - Pose frame data
   * - Snapshot PNG (if available)
   * - Instructions for reconstruction
   */
  async exportAsPackage(videoRef, canvasRef) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const packageData = {
      manifest: {
        version: '1.0',
        format: 'technique-studio-package',
        exportedAt: new Date().toISOString(),
        sessionId: this.session.id,
      },

      session: {
        id: this.session.id,
        createdAt: this.session.createdAt,
        sourceType: this.session.sourceType,
        category: this.session.derived.category,
        movementName: this.session.derived.movementName,
      },

      video: {
        width: this.session.video.width,
        height: this.session.video.height,
        fps: this.session.video.fps,
        durationMs: this.session.video.durationMs,
        available: this.session.flags.hasVideo,
      },

      pose: {
        frameCount: this.session.pose.frames.length,
        frames: this.session.pose.frames, // Lightweight frame references
        timestamps: this.session.pose.timestamps.slice(0, 100), // Sample timestamps
        confidenceSummary: this.session.pose.confidenceSummary,
      },

      annotations: this.session.annotations || [],

      metadata: {
        athleteName: this.session.athleteName || '',
        coachNotes: this.session.coachNotes || '',
        focusAreas: this.session.selectedTags || [],
      },

      reconstruction: {
        instructions: [
          '1. This package contains all data needed to reconstruct the session',
          '2. To reload in Technique Studio, import this JSON',
          '3. For MP4 export, upload this package to a rendering backend',
          '4. Snapshots can be extracted from pose + annotations data',
        ],
        requiredFields: ['session', 'video', 'pose', 'annotations', 'metadata'],
        optionalFields: ['audioComments', 'compareTargets'],
      },
    };

    const packageStr = JSON.stringify(packageData, null, 2);
    return this.downloadFile(packageStr, 'application/json', `package-${this.session.id}-${timestamp}.json`);
  }

  /**
   * Prepare for future MP4 rendering backend
   * Returns a serializable job definition that can be sent to a rendering service
   */
  createMP4RenderJob() {
    return {
      jobId: `render-${this.session.id}-${Date.now()}`,
      version: '1.0',
      targetFormat: 'mp4',
      codec: 'h264',
      preset: 'medium',
      fps: this.session.video.fps || 30,
      width: this.session.video.width || 1280,
      height: this.session.video.height || 720,

      inputs: {
        videoBlob: this.session.video.blob ? '[[BINARY_BLOB]]' : null,
        poseFrames: this.session.pose.frames,
        annotations: this.session.annotations,
      },

      options: {
        includeOverlay: this.options.includeOverlay,
        overlayColor: '#C9A84C',
        overlayThickness: 2,
        fontSize: 12,
        includeFrameCounter: true,
        includeTimestamp: true,
      },

      output: {
        filename: `technique-${this.session.id}.mp4`,
        quality: 'high',
      },

      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Download a file to the user's device
   */
  downloadFile(data, mimeType, filename) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Convenience functions for quick exports
 */
export async function exportSessionAsJSON(session) {
  const renderer = new TechniqueExportRenderer(session);
  return renderer.exportAsJSON();
}

export async function exportSessionAsPackage(session, videoRef, canvasRef) {
  const renderer = new TechniqueExportRenderer(session);
  return renderer.exportAsPackage(videoRef, canvasRef);
}

export function prepareMP4RenderJob(session, options = {}) {
  const renderer = new TechniqueExportRenderer(session, options);
  return renderer.createMP4RenderJob();
}