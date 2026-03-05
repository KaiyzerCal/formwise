import React, { useRef, useState } from "react";
import { Upload, Film } from "lucide-react";

export default function UploadZone({ onFile, analyzing, progress, progressLabel }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("video/")) return;
    onFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="35"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - (progress || 0) / 100)}`}
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-[#C9A84C]" style={{ fontFamily: "'DM Mono', monospace" }}>
              {progress || 0}%
            </span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-white text-sm font-medium tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
            {progressLabel || "Analyzing..."}
          </p>
          <p className="text-white/30 text-xs tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
            Processed locally — private &amp; fast
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 cursor-pointer
        flex flex-col items-center gap-5 transition-all duration-200
        ${dragOver
          ? "border-[#C9A84C] bg-[#C9A84C]/5"
          : "border-white/10 hover:border-[#C9A84C]/50 hover:bg-white/[0.02]"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center">
        <Film className="w-8 h-8 text-[#C9A84C]" />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-white text-sm font-bold tracking-wider" style={{ fontFamily: "'Syne', sans-serif" }}>
          DROP VIDEO HERE
        </p>
        <p className="text-white/30 text-xs tracking-widest uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
          or tap to browse — mp4, mov, webm
        </p>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <Upload className="w-3 h-3 text-white/20" />
        <span className="text-[10px] text-white/20 tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
          Processed locally · never uploaded
        </span>
      </div>
    </div>
  );
}