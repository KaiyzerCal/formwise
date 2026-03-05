import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Disclaimer({ onAccept }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-[#C9A84C]/30 bg-white/5 backdrop-blur-xl p-8 text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#C9A84C]/15 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-[#C9A84C]" />
        </div>
        <h2
          className="text-xl font-bold text-white tracking-wide"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          FORM INTELLIGENCE
        </h2>
        <p className="text-sm text-white/60 leading-relaxed">
          This tool assists with form awareness. It is{" "}
          <span className="text-white/90 font-medium">
            not a substitute for professional coaching
          </span>
          . Stop immediately if you feel pain.
        </p>
        <Button
          onClick={onAccept}
          className="w-full bg-[#C9A84C] hover:bg-[#b8943f] text-black font-bold tracking-wider py-6 text-sm"
        >
          I UNDERSTAND — CONTINUE
        </Button>
      </div>
    </div>
  );
}