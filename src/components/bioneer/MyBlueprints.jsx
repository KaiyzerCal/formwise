import React, { useState, useEffect } from "react";
import { Bookmark, Trash2, Play } from "lucide-react";
import { getBlueprints, deleteBlueprint } from "./blueprintStore";

export default function MyBlueprints({ onSelectBlueprint }) {
  const [blueprints, setBlueprints] = useState([]);

  useEffect(() => {
    setBlueprints(getBlueprints());
  }, []);

  const handleDelete = (id) => {
    deleteBlueprint(id);
    setBlueprints(getBlueprints());
  };

  if (blueprints.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <Bookmark className="w-5 h-5 text-white/20" />
        </div>
        <p className="text-xs text-white/20 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
          No blueprints yet
        </p>
        <p className="text-[10px] text-white/10 mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
          Analyze a video to create one
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 space-y-2">
      {blueprints.map((bp) => (
        <div
          key={bp.id}
          className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3"
        >
          <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-4 h-4 text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate" style={{ fontFamily: "'DM Mono', monospace" }}>
              {bp.label}
            </p>
            <p className="text-[9px] text-white/25 mt-0.5 uppercase tracking-wider" style={{ fontFamily: "'DM Mono', monospace" }}>
              {bp.exerciseId?.replace(/_/g, " ")} · {bp.frameCount} frames
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectBlueprint(bp)}
              className="p-2 rounded-lg bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 transition-colors"
              title="Train with this blueprint"
            >
              <Play className="w-3.5 h-3.5 text-[#C9A84C]" />
            </button>
            <button
              onClick={() => handleDelete(bp.id)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-white/25 hover:text-[#EF4444]" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}