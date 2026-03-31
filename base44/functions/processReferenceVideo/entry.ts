import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * processReferenceVideo — extracts pose keypoints from a reference video.
 * Uses the InvokeLLM integration to analyze the video and extract
 * key body positions per phase of the movement.
 *
 * In a production system this would use a dedicated pose estimation pipeline.
 * For now, we use AI vision to extract the key landmark positions.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { videoId, videoUrl, exerciseId } = await req.json();

    if (!videoId || !videoUrl) {
      return Response.json({ error: 'Missing videoId or videoUrl' }, { status: 400 });
    }

    // Update status to processing
    await base44.asServiceRole.entities.ReferenceVideo.update(videoId, { status: 'processing' });

    // Use AI vision to analyze the video and extract key body positions
    const prompt = `Analyze this exercise video and extract the key body positions for form reference.
    
Exercise: ${exerciseId}

For each major phase of the movement, provide the normalized (0-1) x,y coordinates of these key joints:
- shoulder (right shoulder)
- hip (right hip)
- knee (right knee)
- ankle (right ankle)
- elbow (right elbow)
- wrist (right wrist)

Return the phases with their keypoint data. Each phase should have a name, label, and the joint positions.
Coordinates should be normalized 0-1 where (0,0) is top-left.

IMPORTANT: Be accurate with the positions based on what you see in the video.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [videoUrl],
      response_json_schema: {
        type: "object",
        properties: {
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: { type: "string" },
                label: { type: "string" },
                frame_percentage: { type: "number", description: "0-1, where in the video this phase occurs" },
                keypoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      x: { type: "number" },
                      y: { type: "number" },
                      visibility: { type: "number" }
                    }
                  }
                }
              }
            }
          },
          estimated_fps: { type: "number" },
          estimated_duration: { type: "number" }
        }
      }
    });

    if (!result?.phases?.length) {
      await base44.asServiceRole.entities.ReferenceVideo.update(videoId, {
        status: 'error',
        processing_error: 'Could not extract pose data from video',
      });
      return Response.json({ error: 'No phases extracted' }, { status: 500 });
    }

    // Build keypoints_per_frame by interpolating between phase keypoints
    const totalFrames = Math.round((result.estimated_duration || 5) * (result.estimated_fps || 30));
    const keypointsPerFrame = [];

    for (let f = 0; f < Math.min(totalFrames, 300); f++) {
      const pct = f / totalFrames;
      
      // Find surrounding phases
      let before = result.phases[0];
      let after = result.phases[result.phases.length - 1];
      
      for (let i = 0; i < result.phases.length - 1; i++) {
        if (pct >= result.phases[i].frame_percentage && pct <= result.phases[i + 1].frame_percentage) {
          before = result.phases[i];
          after = result.phases[i + 1];
          break;
        }
      }

      // Interpolate
      const range = (after.frame_percentage || 1) - (before.frame_percentage || 0);
      const t = range > 0 ? (pct - (before.frame_percentage || 0)) / range : 0;

      const frameKps = (before.keypoints || []).map((bkp, idx) => {
        const akp = after.keypoints?.[idx] || bkp;
        return {
          name: bkp.name,
          x: bkp.x + (akp.x - bkp.x) * t,
          y: bkp.y + (akp.y - bkp.y) * t,
          visibility: bkp.visibility ?? 1.0,
        };
      });

      keypointsPerFrame.push(frameKps);
    }

    // Build key_phases with frame indices
    const keyPhases = result.phases.map(p => ({
      phase: p.phase,
      label: p.label,
      frame_index: Math.round((p.frame_percentage || 0) * totalFrames),
    }));

    // Update entity with processed data
    await base44.asServiceRole.entities.ReferenceVideo.update(videoId, {
      status: 'ready',
      fps: result.estimated_fps || 30,
      duration_seconds: result.estimated_duration || 5,
      keypoints_per_frame: keypointsPerFrame,
      key_phases: keyPhases,
    });

    return Response.json({
      videoId,
      status: 'ready',
      framesProcessed: keypointsPerFrame.length,
      phasesDetected: keyPhases.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});