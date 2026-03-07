import React, { useState, useEffect } from "react";
import { getUserPerformance } from "../PerformanceLoopEngine";
import { moduleEnabled } from "../moduleRegistry";
import { Flame, Star, Trophy } from "lucide-react";

export default function XPBadge({ userId }) {
  if (!moduleEnabled("performanceLoop")) return null;

  const [perf, setPerf] = useState(null);

  useEffect(() => {
    if (userId) getUserPerformance(userId).then(setPerf);
  }, [userId]);

  if (!perf) return null;

  const streakActive = (perf.current_streak ?? 0) >= 2;

  return (
    <div className="flex items-center gap-2">
      {/* XP pill */}
      <div className="flex items-center gap-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full px-3 py-1">
        <Star className="w-3 h-3 text-[#C9A84C]" />
        <span className="text-xs font-bold text-[#C9A84C] tabular-nums">{(perf.total_xp ?? 0).toLocaleString()} XP</span>
      </div>

      {/* Streak pill */}
      {(perf.current_streak ?? 0) > 0 && (
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border ${
          streakActive
            ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
            : "bg-white/5 border-white/10 text-gray-500"
        }`}>
          <Flame className="w-3 h-3" />
          <span className="text-xs font-bold tabular-nums">{perf.current_streak}d</span>
        </div>
      )}
    </div>
  );
}