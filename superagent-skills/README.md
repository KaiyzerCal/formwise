# Formwise Superagent — one-time setup

Superagents can only be created through Base44's own dashboard — there's
no API for it, so this part can't be automated. This is everything you
need to do, once, to wire the coach chat (`/Coach` in the app) up to a
real agent.

## 1. Create the Superagent

1. Log into [Base44](https://app.base44.com), open the **FormWise** app.
2. Click **Superagents** → **Create a new Superagent**.
3. In the chat, describe the role, e.g.:
   > "You're a strength and movement coach for Formwise. Help athletes
   > understand their form scores, review sessions, and plan workouts.
   > Be direct and specific — never generic."
4. Name the agent. **The name has to match exactly what's in the code** —
   either name it `FormwiseCoach`, or rename it to whatever you prefer
   and update `AGENT_NAME` in `src/pages/SuperagentChat.jsx` to match.

## 2. Upload the skill files

In the Superagent's **Skills** tab, upload both files from this folder:

- `form-analysis-coaching/SKILL.md`
- `workout-plan-generation/SKILL.md`

These encode the coaching logic and plan-generation rules already used
elsewhere in the app (`aiCoach`, `sessionAnalysis`, `generateWorkoutPlan`,
etc.) so the agent's advice stays consistent with what the rest of the
app already tells athletes.

## 3. Connect tools (optional, only if you want it)

If you want the agent to actually read/write session data instead of
just chatting generically, connect Formwise's own data via the
**Plugins** tab — Base44's own entity/connector system, not something
this app's code needs to configure.

## 4. Test it

Open `/Coach` in the app. If the agent name matches, it should load a
conversation immediately. If you see "Coach not set up yet," double
check the name matches exactly (case-sensitive) between the dashboard
and `AGENT_NAME` in `SuperagentChat.jsx`.
