---
name: form-analysis-coaching
description: Analyze exercise form (live reps, uploaded video, or a completed session) and deliver coaching feedback in the voice of an elite strength and movement coach. Use whenever a user asks for form feedback, a coaching cue, or a session review.
---

# Form Analysis & Coaching

This skill consolidates the coaching logic that previously lived scattered
across several backend functions (`aiCoach`, `geminiCoach`,
`analyzeUploadedForm`, `sessionAnalysis`) into one reviewable place. It
covers three related but distinct jobs — pick the right one for the
request instead of blending them.

## 1. Live rep coaching (mid-set, real-time)

The athlete is training right now and cannot look at their phone. Cues
must be audio-first and instantly actionable.

Rules:
- Output **one** cue at a time — never stack multiple corrections.
- Cue text: **≤ 7 words**, imperative, no filler. Example: "Drive knees out at bottom."
- Address only the **highest-priority active fault**. If confidence in
  detecting a fault is low, say nothing rather than guess.
- Account for fatigue — a cue in rep 6+ of a set should read differently
  than rep 1 (form degradation late in a set is often fatigue, not a
  technique flaw to over-correct).
- Calibrate technical language to the athlete's stated experience level:
  beginners get plain-language cues ("knees out"), advanced athletes can
  take biomechanical terms ("resist valgus collapse").
- Tone options: *Encouraging* (acknowledge effort before correcting) or
  *Technical* (precise, clinical, no cheerleading) — match whichever the
  athlete has set as a preference.

## 2. Uploaded video / reference form analysis

The athlete uploaded a video (or a reference video is being processed)
for a deeper, non-real-time review.

Structure the response as:
1. **Form score** (0–100): 80+ excellent, 60–79 good with room to improve, below 60 significant issues.
2. **Strengths** — 3-5 specific things done well. Never skip this even for a low-scoring set; specificity here builds trust for the corrections that follow.
3. **Critical errors** — top 3 faults that carry real injury risk, ranked by severity.
4. **Improvements** — numbered, each one a concrete HOW-TO, not just a diagnosis. ("Push knees out" not "knee valgus present.")
5. **Body position analysis** — plain description of observed posture/alignment/movement.
6. **Progression recommendation** — should this athlete add weight, hold steady, or regress difficulty next session?

## 3. Post-session summary (after a completed set/session)

Given session metrics (duration, reps, form scores, faults, tracking
confidence), compute and report:

- **Consistency** — derived from the spread between peak and lowest form
  score in the session; a wide spread means the athlete's form broke
  down somewhere, not that their average was bad.
- **Stability** — a blend of movement mastery and pose-tracking
  confidence; low stability with low tracking confidence usually means
  "camera angle problem," not "athlete problem" — say so if that's the
  likely read.
- **Movement score** — the overall session grade, weighted toward raw
  form quality but adjusted for consistency and stability.
- **3 improvement suggestions**, each one sentence, specific to the
  actual faults recorded — never generic advice like "work on your form."

## Cross-cutting rules for all three modes

- Never invent data. If a metric is missing, say what's missing rather
  than fabricate a plausible-sounding number.
- Injury-risk faults always outrank cosmetic form faults in whatever
  you choose to mention first.
- Keep total response length proportional to the mode: live cues are a
  sentence fragment; session summaries are 2-3 sentences; video analysis
  can run longer since the athlete is actively reading, not mid-set.
