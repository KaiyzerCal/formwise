import React, { useRef, useState } from "react";
import { Upload, Video, X, AlertCircle } from "lucide-react";

const MAX_SIZE_MB = 500;
const MAX_DURATION_MIN = 5;

export default function VideoUploadScreen({ onVideoReady, onBack }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null); // { url, duration, name }

  const handleFile = async (file) => {
    setError(null);
    if (!file) return;

    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!validTypes.includes(file.type)) {
      setError("Only MP4, MOV, or WebM files are supported.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    await new Promise((r) => (video.onloadedmetadata = r));

    if (video.duration > MAX_DURATION_MIN * 60) {
      URL.revokeObjectURL(url);
      setError(`Video too long. Max ${MAX_DURATION_MIN} minutes.`);
      return;
    }

    setPreview({ url, duration: video.duration, name: file.name, file });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleContinue = () => {
    if (preview) onVideoReady(preview);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="px-4 pt-12 pb-6 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <X className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h1 className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
            Analyze Video
          </h1>
          <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
            Upload for offline form analysis
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 max-w-lg mx-auto w-full">
        {!preview ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative rounded-2xl border-2 border-dashed cursor-pointer
              flex flex-col items-center justify-center gap-4 py-16 px-8 text-center
              transition-all duration-200
              ${dragging
                ? "border-[#C9A84C] bg-[#C9A84C]/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }
            `}
          >
            <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80" style={{ fontFamily: "'Syne', sans-serif" }}>
                Drop video here or tap to browse
              </p>
              <p className="text-[10px] text-white/30 mt-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                MP4 · MOV · WebM &nbsp;·&nbsp; Max 500MB · 5 min
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video preview */}
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video">
              <video
                src={preview.url}
                className="w-full h-full object-contain"
                controls
                muted
              />
            </div>

            {/* File info */}
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                <Video className="w-4 h-4 text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 truncate" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {preview.name}
                </p>
                <p className="text-[10px] text-white/30 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {Math.round(preview.duration)}s duration
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-full hover:bg-white/10">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-4 rounded-xl bg-[#C9A84C] hover:bg-[#b8943f] text-black font-bold text-sm tracking-[0.2em] uppercase transition-colors"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Analyze This Video
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
            <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
            <p className="text-xs text-[#EF4444]" style={{ fontFamily: "'DM Mono', monospace" }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}