/**
 * SuperagentChat — talks to a Base44 Superagent once one has been created.
 *
 * Superagents can only be created through the Base44 dashboard (no API for
 * it), so this page is intentionally decoupled from that setup: it just
 * needs the agent's name. Until the agent exists, createConversation will
 * fail and this page shows a clear "not set up yet" state instead of a
 * raw error — see superagent-skills/README.md for the one-time setup steps.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import toast from 'react-hot-toast';
import { Send, Loader2 } from 'lucide-react';
import { COLORS, FONT } from '@/components/bioneer/ui/DesignTokens';

// Change this once you've created and named your Superagent in the Base44
// dashboard (see superagent-skills/README.md).
const AGENT_NAME = 'FormwiseCoach';

export default function SuperagentChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const bottomRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const existing = await base44.agents.listConversations({
          q: { agent_name: AGENT_NAME },
          sort: '-created_date',
          limit: 1,
        });
        const conv = existing?.[0] ?? await base44.agents.createConversation({ agent_name: AGENT_NAME });
        if (cancelled) return;
        setConversation(conv);
        setMessages(conv.messages ?? []);
        unsubscribeRef.current = base44.agents.subscribeToConversation(conv.id, (updated) => {
          setMessages(updated.messages ?? []);
        });
      } catch (err) {
        console.error('[SuperagentChat] Could not reach agent:', err);
        if (!cancelled) setSetupNeeded(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversation || sending) return;
    setInput('');
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } catch (err) {
      console.error('[SuperagentChat] Send failed:', err);
      toast.error('Could not reach the coach right now. Please try again.');
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, conversation, sending]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.gold }} />
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 rounded-lg text-center"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, fontFamily: FONT.mono }}>
        <h2 className="text-lg mb-2" style={{ color: COLORS.gold }}>Coach not set up yet</h2>
        <p className="text-sm" style={{ color: COLORS.textSecondary }}>
          This page talks to a Base44 Superagent named <strong>{AGENT_NAME}</strong>, which
          hasn't been created yet. See <code>superagent-skills/README.md</code> for the
          one-time setup steps, or change <code>AGENT_NAME</code> in this file to match an
          agent you've already created.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-2xl mx-auto" style={{ fontFamily: FONT.mono }}>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.filter(m => !m.hidden).map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap"
              style={{
                background: m.role === 'user' ? COLORS.goldDim : COLORS.surface,
                border: `1px solid ${m.role === 'user' ? COLORS.goldBorder : COLORS.border}`,
                color: COLORS.textPrimary,
              }}
            >
              {typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm" style={{ color: COLORS.textTertiary }}>
            Ask your coach about your form, a recent session, or your workout plan.
          </p>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-4 border-t" style={{ borderColor: COLORS.border }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask your coach..."
          disabled={sending}
          className="flex-1 rounded px-3 py-2 text-sm outline-none"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="rounded px-3 py-2 disabled:opacity-40"
          style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.goldBorder}`, color: COLORS.gold }}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
