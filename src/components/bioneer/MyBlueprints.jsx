import React, { useState, useEffect } from "react";
import { Bookmark, Trash2, Play, ChevronRight } from "lucide-react";
import { getBlueprints, deleteBlueprint } from "./blueprintStore";
import BlueprintDetailScreen from "./BlueprintDetailScreen";

export default function MyBlueprints({ onSelectBlueprint }) {
  const [blueprints, setBlueprints] = useState([]);
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    setBlueprints(getBlueprints());
  }, []);

  const handleDelete = (id) => {
    deleteBlueprint(id);
    setBlueprints(getBlueprints());
  };

  // Show detail screen
  if (detailId) {
    return (
      <BlueprintDetailScreen
        blueprintId={detailId}
        onBack={() => { setDetailId(null); setBlueprints(getBlueprints()); }}
        onTrain={(bp) => onSelectBlueprint(bp)}
      />
    );
  }

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
    <div className="pb-4 space-y-2">
      {blueprints.map((bp) => (
        <button
          key={bp.id}
          onClick={() => { console.log("BLUEPRINT_TAP blueprintId=", bp.id); setDetailId(bp.id); }}
          className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 p-3 hover:bg-white/[0.05] active:scale-[0.99] transition-all text-left"
          style={{ cursor: "pointer" }}
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
          <ChevronRight className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}