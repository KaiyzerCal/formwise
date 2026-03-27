import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoUrl, referenceExercise, referenceDescription } = await req.json();

    if (!videoUrl) {
      return Response.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    // Call InvokeLLM to analyze the uploaded video against the reference form
    const analysisPrompt = `You are an expert fitness coach analyzing a user's exercise form in the video.

EXERCISE: ${referenceExercise || 'Unknown exercise'}
REFERENCE: ${referenceDescription || 'Standard form technique'}

Analyze the video and provide a structured assessment:

1. **formScore** (0-100): Overall form quality
   - 80+: Excellent form, minimal corrections needed
   - 60-79: Good form with some improvements possible
   - Below 60: Significant form issues present

2. **strengths**: List 3-5 specific things done well

3. **criticalErrors**: List top 3 form errors that risk injury

4. **improvements**: Numbered list with specific HOW-TO fixes

5. **bodyPositionAnalysis**: Describe observed posture, alignment, and movement

6. **progressionRecommendation**: Specific advice on weight/difficulty progression

Respond ONLY with valid JSON matching these exact field names.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      file_urls: [videoUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          formScore: { type: 'number', minimum: 0, maximum: 100 },
          strengths: { type: 'array', items: { type: 'string' } },
          criticalErrors: { type: 'array', items: { type: 'string' } },
          improvements: { type: 'array', items: { type: 'string' } },
          bodyPositionAnalysis: { type: 'string' },
          progressionRecommendation: { type: 'string' }
        },
        required: ['formScore', 'strengths', 'criticalErrors', 'improvements', 'bodyPositionAnalysis', 'progressionRecommendation']
      }
    });

    return Response.json({
      success: true,
      analysis: result
    });
  } catch (error) {
    console.error('[analyzeUploadedForm] Error:', error);
    return Response.json({ 
      error: error.message || 'Analysis failed',
      success: false
    }, { status: 500 });
  }
});