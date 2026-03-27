import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { COLORS, FONT } from '../ui/DesignTokens';
import { Upload, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

export default function CustomVideoAnalyzer({ referenceExercise = 'Custom Exercise', onAnalysisComplete }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [filename, setFilename] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    setAnalysis(null);
    setVideoSrc(URL.createObjectURL(file));
    setFilename(file.name);
  };

  const handleAnalyze = useCallback(async () => {
    if (!videoSrc) return;
    
    setAnalyzing(true);
    setError(null);
    try {
      // Upload video to get URL for LLM analysis
      const videoBlob = await fetch(videoSrc).then(r => r.blob());
      const uploadedFile = await base44.integrations.Core.UploadFile({ file: videoBlob });
      
      const result = await base44.functions.invoke('analyzeUploadedForm', {
        videoUrl: uploadedFile.file_url,
        referenceExercise: referenceExercise,
        referenceDescription: 'Analyze exercise form and provide feedback'
      });

      if (result.data?.success) {
        setAnalysis(result.data.analysis);
        onAnalysisComplete?.(result.data.analysis);
      } else {
        setError(result.data?.error || 'Analysis failed. Try uploading a different video.');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze video. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [videoSrc, referenceExercise, onAnalysisComplete]);

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border" style={{ borderColor: COLORS.border, background: `${COLORS.surface}50` }}>
      <div className="space-y-2">
        <label className="text-[9px] tracking-[0.2em] uppercase block font-bold" style={{ color: COLORS.gold }}>
          <Zap size={12} className="inline mr-1.5" />
          AI Form Analysis
        </label>
        <p className="text-[8px]" style={{ color: COLORS.textTertiary }}>
          Upload your video for instant AI-powered form feedback and comparison to ideal technique
        </p>
      </div>

      {/* Upload button */}
      <button 
        onClick={() => fileRef.current?.click()}
        disabled={analyzing}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed transition-colors disabled:opacity-50"
        style={{
          borderColor: videoSrc ? `${COLORS.gold}60` : COLORS.border,
          background: videoSrc ? COLORS.goldDim : 'transparent',
        }}>
        <Upload size={14} strokeWidth={1.5} style={{ color: videoSrc ? COLORS.gold : COLORS.textTertiary, flexShrink: 0 }} />
        <span className="text-[9px] truncate text-left" style={{ color: videoSrc ? COLORS.gold : COLORS.textTertiary, fontFamily: FONT.mono }}>
          {filename || 'Upload video for analysis'}
        </span>
      </button>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

      {/* Video preview */}
      {videoSrc && (
        <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: COLORS.border, background: '#000', maxHeight: 240 }}>
          <video ref={videoRef} src={videoSrc} controls className="w-full h-full object-contain" style={{ maxHeight: 240 }} />
        </div>
      )}

      {/* Analyze button */}
      {videoSrc && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-[9px] uppercase tracking-[0.1em] transition-all disabled:opacity-50"
          style={{
            background: analyzing ? COLORS.goldDim : COLORS.gold,
            color: analyzing ? COLORS.gold : '#000'
          }}>
          {analyzing ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap size={12} />
              Analyze Form
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 flex gap-2" style={{ fontSize: 11 }}>
          <AlertCircle size={14} className="flex-shrink-0" style={{ color: '#EF4444', marginTop: 1 }} />
          <div style={{ color: '#EF4444', fontFamily: FONT.mono }}>{error}</div>
        </div>
      )}

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-3 p-3 rounded-lg border" style={{ borderColor: COLORS.goldBorder, background: COLORS.goldDim }}>
          {/* Score */}
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] font-bold" style={{ color: COLORS.textTertiary }}>Form Score</span>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold" style={{ color: analysis.formScore >= 70 ? COLORS.correct : analysis.formScore >= 50 ? COLORS.warning : '#EF4444' }}>
                {analysis.formScore}
              </div>
              <div className="text-[9px]" style={{ color: COLORS.textTertiary }}>/100</div>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} style={{ color: COLORS.correct, flexShrink: 0 }} />
                <span className="text-[8px] uppercase tracking-[0.1em] font-bold" style={{ color: COLORS.correct }}>Strengths</span>
              </div>
              <div className="ml-4 space-y-1">
                {analysis.strengths.slice(0, 3).map((str, i) => (
                  <div key={i} className="text-[8px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    • {str}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Errors */}
          {analysis.criticalErrors?.length > 0 && (
            <div className="space-y-1.5 p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={11} style={{ color: '#EF4444', flexShrink: 0 }} />
                <span className="text-[8px] uppercase tracking-[0.1em] font-bold" style={{ color: '#EF4444' }}>Critical Errors</span>
              </div>
              <div className="ml-4 space-y-1">
                {analysis.criticalErrors.slice(0, 3).map((err, i) => (
                  <div key={i} className="text-[8px]" style={{ color: '#EF4444', fontFamily: FONT.mono }}>
                    • {err}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {analysis.improvements?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[8px] uppercase tracking-[0.1em] font-bold block" style={{ color: COLORS.warning }}>Action Items</span>
              <div className="space-y-1 ml-2">
                {analysis.improvements.slice(0, 3).map((imp, i) => (
                  <div key={i} className="text-[7.5px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                    {i + 1}. {imp}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progression */}
          {analysis.progressionRecommendation && (
            <div className="p-2 rounded border" style={{ borderColor: COLORS.goldBorder, background: 'transparent' }}>
              <span className="text-[8px] uppercase tracking-[0.1em] font-bold block mb-1" style={{ color: COLORS.gold }}>Next Steps</span>
              <p className="text-[8px]" style={{ color: COLORS.textSecondary, fontFamily: FONT.mono }}>
                {analysis.progressionRecommendation}
              </p>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={() => {
              setVideoSrc(null);
              setAnalysis(null);
              setFilename('');
            }}
            className="w-full px-3 py-1.5 rounded text-[8px] uppercase font-bold tracking-[0.08em]"
            style={{ background: COLORS.border, color: COLORS.textSecondary }}>
            Analyze Another Video
          </button>
        </div>
      )}
    </div>
  );
}