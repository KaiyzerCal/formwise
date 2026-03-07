import React, { useState, useEffect } from "react";
import { getBenchmark } from "../BiomechanicsEngine";
import { moduleEnabled } from "../moduleRegistry";
import { TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";

export default function BenchmarkCard({ userId, movementId, sessionScore }) {
  if (!moduleEnabled("biomechanics")) return null;
  if (!userId || !movementId || sessionScore == null) return null;

  const [bm, setBm] = useState(null);

  useEffect(() => {
    getBenchmark(userId, movementId, sessionScore).then(setBm);
  }, [userId, movementId, sessionScore]);

  if (!bm) return null;

  const vsPB    = parseFloat(bm.vsPersonalBest);
  const vsCohort = parseFloat(bm.vsCohortAvg);

  const Delta = ({ val, label }) => {
    const pos  = val > 0;
    const zero = val === 0;
    return (
      <div className="flex-1 bg-white/3 rounded-lg p-3 text-center border border-white/5">
        <div className={`flex items-center justify-center gap-1 text-base font-bold tabular-nums ${
          zero ? "text-gray-500" : pos ? "text-emerald-400" : "text-red-400"
        }`}>
          {zero ? <Minus className="w-3.5 h-3.5" /> : pos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {pos ? "+" : ""}{val.toFixed(1)}%
        </div>
        <p className="text-xs text-gray-600 mt-1 font-mono">{label}</p>
      </div>
    );
  };

  return (
    <div className="mt-4 border border-white/10 rounded-xl bg-[#0F0F0F] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <BarChart2 className="w-4 h-4 text-[#C9A84C]" />
        <span className="text-sm font-semibold text-[#C9A84C] tracking-wider">BENCHMARKS</span>
        <span className="text-xs text-gray-600 ml-auto">{bm.cohortPercentile}</span>
      </div>
      <div className="p-3 flex gap-2">
        <Delta val={vsPB}     label="VS PERSONAL BEST" />
        <Delta val={vsCohort} label="VS COHORT AVG" />
      </div>
      <div className="px-4 pb-3 flex gap-4 text-xs text-gray-600">
        <span>Your best: <span className="text-gray-400">{Math.round(bm.personalBest)}</span></span>
        <span>Cohort avg: <span className="text-gray-400">{bm.cohortAvg}</span></span>
        <span>This session: <span className="text-gray-400">{Math.round(sessionScore)}</span></span>
      </div>
    </div>
  );
}