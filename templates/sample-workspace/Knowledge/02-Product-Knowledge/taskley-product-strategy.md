# Taskley – Product Strategy

## Strategic context
Taskley competes in a crowded landscape of generic to‑do apps and all‑in‑one productivity tools.
Many competitors optimize for feature breadth or team collaboration, leaving a gap for individuals who want **help making and executing a realistic daily plan** rather than managing complex projects.

Taskley’s product strategy is to **own the "Today" experience** for individual knowledge workers: when they ask, "What should I work on next?", Taskley should be the most trusted answer.

## North Star
**North Star metric:** Number of **Completed Planned Days per Active User per Month**.

A "Planned Day" is defined as a day where a user:
- Opens Taskley in the morning or prior evening.
- Explicitly confirms a Today Plan (e.g., selecting and committing to a set of tasks for today).
- Completes at least one of the planned tasks.

This metric balances:
- Habit (coming back to the app to plan the day).
- Commitment (making conscious trade‑offs for today).
- Execution (actually checking off work that was planned, not just random tasks).

## Pillars and principles

### 1. Plan‑first, list‑second
Most apps prioritize lists and projects; planning is an afterthought.
Taskley inverts this by making the **Today Plan** the primary surface:
- Every session gently nudges the user into reviewing or creating a plan.
- Backlogs and projects are available but deliberately pushed a layer deeper.

Design principles:
- Default view is Today, not Inbox.
- It should be hard to end a session without a clear next step.

### 2. Realism over aspiration
Taskley is opinionated about **doing less, better**:
- Soft limits on how many tasks or how much estimated time users can add to Today.
- Visual indicators when a plan is unrealistic (e.g., too many high‑effort tasks).
- Encourages users to consciously defer or drop tasks instead of rolling them forward endlessly.

Design principles:
- Make trade‑offs visible (e.g., "If you add this, something else needs to move").
- Celebrate completion of a realistic plan more than raw task count.

### 3. Time, energy, and context aware
Taskley recognizes that productivity is more than slots on a calendar:
- Users can tag tasks by energy level, context (e.g., "deep work", "calls"), or location.
- The app suggests when to tackle certain tasks (e.g., morning deep work, afternoon admin).
- Integrations with calendars and focus modes reduce friction when starting work.

Design principles:
- Use simple, understandable signals (not opaque AI magic).
- Reduce cognitive load by surfacing a small, curated set of options.

### 4. Gentle guidance, not rigid systems
Many users bounce off tools that require strict workflows.
Taskley aims to **guide** instead of enforce:
- Optional rituals (morning planning, evening review) with lightweight prompts.
- Smart suggestions that can be ignored without breaking the system.
- Defaults that work well for most users, with gradual reveal of advanced features.

Design principles:
- No "system police": users should not feel punished for skipping a day.
- Language and visuals should feel encouraging, not judgmental.

## Strategic bets (12–24 months)

1. **Daily planning ritual as a habit loop**
   - Make it effortless and rewarding to plan the day in 3–5 minutes.
   - Use subtle streaks, gentle reminders, and end‑of‑day reflections to reinforce the habit.

2. **Smarter, AI‑assisted planning – but explainable**
   - Use AI primarily to simplify, not impress: summarize backlogs, propose draft plans, and suggest realistic workloads.
   - Keep recommendations transparent: show why certain tasks were suggested and let users easily adjust.

3. **Deeper calendar and device integrations**
   - Two‑way sync with major calendars.
   - Tight integrations with mobile OS features (widgets, notifications, focus modes) to make Taskley feel like part of the system.

4. **Monetization aligned with depth of use**
   - Free tier optimized for lightweight usage and trial of the daily planning habit.
   - Premium unlocks features that matter most to engaged users: multi‑device, advanced planning, analytics, and focus modes.

## Success metrics

### Engagement and habit
- Weekly Active Users (WAU) and Monthly Active Users (MAU).
- Retention at 4, 8, and 12 weeks.
- Planned Days per Active User per Month (North Star).
- Morning planning completion rate (percentage of active days where a plan is confirmed).

### Outcome and satisfaction
- Self‑reported sense of control and stress (via in‑app NPS‑style pulses).
- Task completion rate for planned vs. unplanned tasks.
- Feature‑specific adoption (e.g., timeboxing, energy tagging, rituals).

### Monetization
- Free → Premium conversion rate.
- Premium retention and churn.
- ARPU and share of annual vs. monthly plans.

## Guardrails and anti‑goals
To maintain a coherent product, Taskley explicitly avoids:
- Becoming a full project management tool for teams.
- Adding heavy collaboration features (complex permissions, workflows, etc.).
- Turning into a generic note‑taking or document app.
- Over‑gamifying with points/badges that distract from actual work.

These guardrails keep the product strategy focused on the individual daily planning problem, which is where Taskley aims to differentiate.

## Role of the new feature (for the workshop)
Any new feature that PMs design in the exercise should clearly answer:
- How does this help our primary ICP have more **Completed Planned Days**?
- Does it strengthen one of the core pillars (plan‑first, realism, time/energy awareness, gentle guidance)?
- Does it respect our guardrails and avoid dragging Taskley toward heavy team/project work?

This framing should help participants evaluate trade‑offs and keep their proposals grounded in Taskley’s strategy, not just in what is possible to build with code.
