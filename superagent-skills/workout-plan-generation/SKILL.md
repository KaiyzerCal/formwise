---
name: workout-plan-generation
description: Generate a personalized workout plan from a user's stated goal, experience level, weak areas, and recent session history. Use when a user asks for a new training plan or to regenerate their current one.
---

# Workout Plan Generation

Consolidates the plan-generation logic previously hardcoded in the
`generateWorkoutPlan` backend function. The goal is a plan that reflects
what the athlete has actually been doing, not just what they claim their
level is.

## Step 1 — Determine real difficulty

Don't take the athlete's self-reported experience level at face value.
Pull their recent session history (last ~10 sessions) and compute their
average form score:

- Average form score > 75 **and** self-reported intermediate/advanced → **advanced**
- Average form score > 60 → **intermediate**
- Otherwise → use their self-reported level, default **beginner**

This exists because self-reported level is aspirational more often than
accurate — someone who calls themselves "advanced" but is scoring 45s on
form should get a beginner-appropriate plan even if that's not what they
asked for. If you downgrade their stated level, say so plainly and why.

## Step 2 — Select exercises

Filter the exercise library by:
- **Difficulty match**: beginner plans only get beginner exercises;
  intermediate plans get beginner+intermediate; advanced plans get
  everything.
- **Weak-area match**: prefer exercises whose focus areas overlap with
  the athlete's stated weak areas (e.g. hip, knee, shoulder). If no weak
  areas are given, don't filter on this axis.
- Cap the plan at **4 exercises** — more than that per plan reduces
  adherence, not fitness outcome.
- If filtering leaves zero exercises (rare, usually an advanced athlete
  with an unusual weak-area combo), fall back to the top 3 exercises for
  their category at beginner difficulty rather than returning an empty
  plan.

## Step 3 — Set volume by difficulty

| Difficulty   | Target reps | Target sets |
|--------------|-------------|--------------|
| beginner     | 8           | 3            |
| intermediate | 6           | 4            |
| advanced     | 5           | 4            |

## Step 4 — Set frequency and duration

- Beginner: 3x/week. Intermediate/advanced: 4x/week.
- Duration defaults to 4 weeks unless the athlete specifies otherwise.
- `total_planned_sessions = frequency_per_week × duration_weeks` — always
  compute this, never hardcode it, so progress tracking stays accurate.

## Naming and framing

Name the plan `"{Goal} Plan ({Difficulty})"` (e.g. "Strength Plan
(intermediate)") so the athlete can tell at a glance what they're
looking at without opening it.

When presenting a generated plan, lead with *why* it looks the way it
does (their actual recent form scores, not just their stated goal) —
that's what makes the plan feel earned rather than templated.
