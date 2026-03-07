import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { getCoachingThread, addCoachingMessage } from "../CoachingGraphService";
import { moduleEnabled } from "../moduleRegistry";
import { MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";

export default function CoachingThreadPanel({ sessionId }) {
  if (!moduleEnabled("coaching")) return null;

  const [thread, setThread]       = useState(null);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser]           = useState(null);
  const bottomRef                 = useRef();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    getCoachingThread(sessionId).then(setThread);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  const send = async () => {
    if (!input.trim() || !thread || !user) return;
    setSending(true);
    const msg = await addCoachingMessage(thread.id, {
      text:       input.trim(),
      authorId:   user.email,
      authorRole: user.role === "admin" ? "coach" : "athlete",
    });
    setThread(prev => ({ ...prev, messages: [...(prev.messages ?? []), msg] }));
    setInput("");
    setSending(false);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  if (!thread) return null;

  const messages = thread.messages ?? [];

  return (
    <div className="mt-6 border border-[#C9A84C]/30 rounded-xl bg-[#0F0F0F] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-semibold text-[#C9A84C] tracking-wider">COACHING THREAD</span>
          {messages.length > 0 && (
            <span className="text-xs bg-[#C9A84C]/20 text-[#C9A84C] px-2 py-0.5 rounded-full">{messages.length}</span>
          )}
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
      </button>

      {!collapsed && (
        <>
          {/* Messages */}
          <div className="max-h-64 overflow-y-auto px-4 py-2 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center">No messages yet. Add a coaching note below.</p>
            ) : (
              messages.map((msg, i) => {
                const isSystem = msg.author_role === "system";
                const isCoach  = msg.author_role === "coach";
                return (
                  <div key={msg.id ?? i} className={`flex gap-2 ${isCoach ? "flex-row-reverse" : ""}`}>
                    <div className={`text-xs px-1.5 py-0.5 rounded self-end font-mono shrink-0 ${
                      isSystem ? "bg-[#C9A84C]/10 text-[#C9A84C]" :
                      isCoach  ? "bg-blue-900/30 text-blue-400" : "bg-white/5 text-gray-400"
                    }`}>
                      {isSystem ? "SYS" : isCoach ? "COACH" : "ATH"}
                    </div>
                    <div className={`text-sm text-gray-200 bg-white/5 rounded-lg px-3 py-2 max-w-[80%] ${
                      isSystem ? "border border-[#C9A84C]/20 text-[#C9A84C]/80 italic" : ""
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/5 px-3 py-2 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Add coaching note…"
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="text-[#C9A84C] hover:text-yellow-300 disabled:opacity-40 transition-colors p-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}