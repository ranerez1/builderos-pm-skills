---
name: 14-mixpanel-data-analysis
description: Investigates product metrics in Mixpanel and turns the findings into a live dashboard plus a saved analysis memo. Use when the user asks why a metric moved, wants a deep dive / root cause on a trend, asks to build or design a Mixpanel dashboard, or runs /14-mixpanel-data-analysis.
---

# 14 Mixpanel Data Analysis → investigate, then make the answer durable

This skill runs a **quantitative investigation** in Mixpanel and leaves behind two things: a
**live dashboard** that holds the evidence, and a **dated memo** under `Outputs/` that other
BuilderOS skills can read. It is the numbers-side counterpart to `/01-customer-discovery`
(which works the qualitative side).

It is a guided investigation, not a one-shot lookup. The goal is an answer you can defend with
evidence, framed against the metric the team actually cares about.

## Configuration

Before anything else, resolve the connection and the context:

- **Analytics MCP server** — read `Knowledge/workspace-tools.md` → **Analytics** → `MCP Server`.
  Every query and dashboard call goes through that server. **Never hardcode a server name.**
- **What "good" means here** — read `CLAUDE.md` for the **Primary metric / North Star (NSM)**,
  product, and target users. Anchor the investigation to that metric where the question relates
  to it, so findings ladder up to something the team is steering by.

If no analytics MCP is configured in `Knowledge/workspace-tools.md`, **stop** and say exactly
what to add (tool name + MCP server name under the Analytics block). Do not guess a server.

## When to use this

Use it when the user wants to *understand* or *present* behaviour in the data:

- "Why did [metric] drop / spike / change?"
- "Deep dive / root-cause [trend] for me."
- "What's driving [activation / retention / conversion]?"
- "Build me a dashboard for [theme]."

Do **not** use it for a single direct lookup ("what was DAU yesterday?") — that's one query, run
it directly and skip this workflow.

## Workflow

### 1) Frame the question

Pin down scope before touching the data. Pull what you can from the request and `CLAUDE.md`;
ask only for what's genuinely missing or ambiguous:

- **Project** — which Mixpanel project (ask if the user has more than one).
- **Events** — which events relate to the question.
- **Properties** — which breakdowns are likely to explain variation (platform, plan tier,
  utm_source, …). Pick the few you'd actually expect a delta on, not every property.
- **Metric anchor** — if the question touches the NSM or a driver of it, say so; it sharpens
  what "answered" means.

State your assumptions in one short block and **confirm them before querying** — the whole
analysis rests on this being right. Mark anything you couldn't resolve with `[NEED: …]`.

### 2) Confirm the data exists, then plan

Run a few **small probe queries** to verify the events and properties exist and carry
non-trivial volume in the analysis window. Be resilient — if a name doesn't resolve, discover
the schema and try again. If volume is zero, partial, or suspiciously low, surface that **before**
going deeper; a query that returns zero rows is missing data, not a finding.

Then show a compact plan and **wait for an explicit go-ahead**:

```
Investigation plan
- Project:    <project>
- Question:   <the question, tied to the NSM if relevant>
- Events:     <event_a>, <event_b>
- Breakdowns: <property_1>, <property_2>
- First queries:
  1. <baseline trend to establish the shape>
  2. <breakdown that would isolate where the change lives>
```

If the user revises scope, restate the plan and re-confirm.

### 3) Investigate

Work the loop until you can answer the question or name the missing data:

1. **Run** a query (or a couple) from the plan.
2. **Interpret** — what stands out, what's flat, what's surprising.
3. **Form a hypothesis** — then either sharpen the next query to test it, or, if the data is
   conclusive, move to evidence.

Principles:

- **Broad first, then narrow.** Establish the overall shape before slicing.
- **Slice where you expect variation**, not everywhere.
- **Correlate timing.** If the metric moved on a date, ask what else changed then — a release,
  a campaign, a pricing change, an outage.

Let the data steer the next query; don't march through a fixed list.

### 4) Build the dashboard as living evidence

Turn the findings into a dashboard so the answer stays true as new data arrives. (If the
configured analytics MCP has no dashboard tools, skip to step 5 and instead hand the user
ready-to-build query specs — see Guardrails.)

- **Discover before you build.** Resolve real event/property names from the schema; validate
  every query returns non-empty data before it goes on the dashboard.
- **Compose a narrative, not a pile of charts.** Headline metrics up top, supporting breakdowns
  below, so it reads top-to-bottom. Aim for **~4–8 rows**, **2–4 cards per row**; keep one
  conceptual focus per row. A lone chart in a row wastes space — pair it or add a short text card.
- **Name every report so it's legible without opening it** — what the metric is, what it's broken
  down by, the window it covers. Avoid bare "Funnel" / "Trend".
- **Set the time filter intentionally.** A dashboard-global filter overrides each report; only use
  it when you want a single shared window.
- **Text cards are signposts, not essays** — at most one per row; lead with the takeaway. Use one
  up top for context (scope, audience, caveats).
- **Title:** a distinguishing emoji + the theme, so it's recognisable at a glance.
- When you present it, give the **dashboard URL only** — never the individual report URLs.

### 5) Write the memo and hand off

Save the investigation as a BuilderOS artifact so the rest of the workflow can use it.

- Directory: `Outputs/Analytics/` (create if missing).
- File: `Outputs/Analytics/YYYY-MM-DD_<short-slug>.md`, using this shape:

```markdown
# Analysis: [question in a few words]

- **Date**: YYYY-MM-DD
- **Project / window**: [project] · [date range]
- **Metric anchor**: [NSM or driver this relates to, or "n/a"]

## Answer
[1–2 sentences answering the original question.]

## Evidence
- [Finding] — [the query/breakdown that shows it]
- **Live dashboard**: [URL]

## Caveats & alternatives
- [What the data can't tell us; explanations you can't rule out; sampling/volume caveats]

## Recommended next actions
- [What to do or decide next — and the natural follow-on skill, e.g. /02-pm-planner to turn
  this into an initiative, or /09-pm-reviewer if this is a post-ship outcome check.]
```

## Guardrails

- **Never fabricate numbers, events, or trends.** If something can't be measured, write `[NEED: …]`.
- **Confirm scope before the full run** (step 1) and the plan before investigating (step 2).
- **Zero rows == missing data**, not a result — say so rather than reporting an empty chart.
- **Graceful degradation:** if the analytics MCP lacks dashboard tools, still deliver the memo and
  include the exact query specs (events, breakdowns, windows) the user needs to build the
  dashboard by hand.
- **Dashboard URL only** in the output — the dashboard already contains the reports.

## Output (to the user)

- Path to the saved memo (`Outputs/Analytics/…`)
- The live dashboard URL (or, if degraded, the query specs)
- A **5–10 bullet** summary: the answer, the strongest evidence, and the recommended next step

## Collaboration

- **Complements** `/01-customer-discovery` — quantitative evidence alongside the qualitative trends.
- **Feeds** `/02-pm-planner` (evidence for initiative candidates) and `/05-create-prd` (the
  "Data & analytics" and success-metric sections).
- **Answers the outcome question** `/09-pm-reviewer` raises — run it to check whether a shipped
  change actually moved the metric.
