import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Trophy, AlertTriangle, Clock, Repeat } from "lucide-react";
import { format } from "date-fns";
import { EXERCISES } from "../components/bioneer/exerciseLibrary";

function getExerciseInfo(id) {
  return EXERCISES.find((e) => e.id === id) || { name: id, icon: "🏋️" };
}

export default function FormHistory() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["formSessions"],
    queryFn: () => base44.entities.FormSession.list("-created_date", 50),
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <a
            href={createPageUrl("FormCheck")}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </a>
          <h1
            className="text-sm font-bold tracking-[0.2em] text-[#C9A84C] uppercase"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Session History
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
              <Repeat className="w-7 h-7 text-white/15" />
            </div>
            <p className="text-white/30 text-sm">No sessions yet</p>
            <p className="text-white/15 text-xs mt-1">Complete a form check to see your history</p>
          </div>
        )}

        {sessions.map((session) => {
          const ex = getExerciseInfo(session.exercise_id);
          const score = session.form_score_overall || 0;
          const scoreColor = score >= 80 ? "#22C55E" : score >= 65 ? "#EAB308" : "#EF4444";

          return (
            <div
              key={session.id}
              className="rounded-xl bg-white/[0.04] border border-white/5 p-4 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{ex.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {ex.name}
                    </h3>
                    <p className="text-[10px] text-white/30 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {session.created_date
                        ? format(new Date(session.created_date), "MMM d, yyyy · h:mm a")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-xl font-bold"
                    style={{ fontFamily: "'DM Mono', monospace", color: scoreColor }}
                  >
                    {score}%
                  </span>
                  {score >= 80 && <Trophy className="w-3.5 h-3.5 text-[#C9A84C] ml-auto mt-0.5" />}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Repeat className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/40" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {session.reps_detected || 0} reps
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] text-white/40" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {session.duration_seconds || 0}s
                  </span>
                </div>
                {(session.alerts || []).length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-[#EF4444]/50" />
                    <span className="text-[10px] text-[#EF4444]/50" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {session.alerts.length} alerts
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}