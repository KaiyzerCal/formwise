import { base44 } from "@/api/base44Client";
import { eventBus } from "./eventBus";
import { moduleEnabled } from "./moduleRegistry";

const SERVICE = "CoachingGraphService";

// ── Subscriptions ─────────────────────────────────────────────────────────────

eventBus.subscribe("SessionReviewCompleted", async ({ payload }) => {
  if (!moduleEnabled("coaching")) return;
  console.log(`[${SERVICE}] SessionReviewCompleted → creating thread + event`);

  const { sessionId, movementId, score, faults, userId } = payload;
  if (!sessionId || !userId) return;

  // Create thread if not exists (one per session)
  const existing = await base44.entities.CoachingThread.filter({ session_id: sessionId });
  let thread = existing[0];
  if (!thread) {
    thread = await base44.entities.CoachingThread.create({
      session_id: sessionId,
      athlete_id: userId,
      messages:   [],
    });
  }

  // Log coaching event
  await base44.entities.CoachingEvent.create({
    user_id:     userId,
    session_id:  sessionId,
    event_type:  "analysis_generated",
    movement_id: movementId,
    fault_ids:   faults ?? [],
    score:       score ?? 0,
  });

  // Auto system message for primary fault
  if (faults && faults.length > 0) {
    const systemMsg = {
      id:          crypto.randomUUID(),
      author_id:   "system",
      author_role: "system",
      text:        `Primary fault detected: ${faults[0]}. Focus on correcting this first.`,
      created_at:  new Date().toISOString(),
    };
    const updatedMsgs = [...(thread.messages ?? []), systemMsg];
    await base44.entities.CoachingThread.update(thread.id, { messages: updatedMsgs });
    eventBus.emit("CoachFeedbackAdded", { threadId: thread.id, sessionId });
  }
});

// ── API helpers (used by UI components) ──────────────────────────────────────

export async function getCoachingThread(sessionId) {
  const results = await base44.entities.CoachingThread.filter({ session_id: sessionId });
  return results[0] ?? null;
}

export async function addCoachingMessage(threadId, { text, authorId, authorRole = "coach", timestampLink, attachmentUrl } = {}) {
  const thread = await base44.entities.CoachingThread.filter({ id: threadId });
  if (!thread[0]) throw new Error("Thread not found");

  const msg = {
    id:             crypto.randomUUID(),
    author_id:      authorId,
    author_role:    authorRole,
    text,
    attachment_url: attachmentUrl ?? null,
    timestamp_link: timestampLink ?? null,
    created_at:     new Date().toISOString(),
  };

  const updated = [...(thread[0].messages ?? []), msg];
  await base44.entities.CoachingThread.update(threadId, { messages: updated });
  eventBus.emit("CoachFeedbackAdded", { threadId, sessionId: thread[0].session_id });
  return msg;
}

export async function getCoachingTimeline(userId, limit = 20) {
  return base44.entities.CoachingEvent.filter({ user_id: userId }, "-created_date", limit);
}