# Reference — 10 Competitor Feature Analysis

> **Invocation:** `npm run competitor-*` below is shorthand. The portable form is
> `npm --prefix .claude/skills/10-competitor-feature-analysis run competitor-* -- <args>`, which runs
> the skill's own `package.json` with no workspace-root setup. Use the shorthand only if the workspace
> root `package.json` also defines these scripts.

## Orchestrator exit codes

| Code | Meaning | Agent action |
|------|---------|--------------|
| `0` | Replays succeeded | Scaffold report → fill PM content → presentation |
| `1` | Replay/setup failed | Fix flow cache or re-discover |
| `2` | Auth required | User runs `competitor-login --verify <feature-url>` |
| `3` | Discovery required | Run discover loop per manifest |

## Navigation strategy decision tree

1. **Hub / sidebar entry** — `click` from snapshot refs.
2. **SPA detail route** — `goto --url` or `capture-screen --url` if click chain fails.
3. **Row edit / ⋯ menu** — `hover` then `click`.
4. **Plan-gated create** — capture upsell as `--optional --condition plan-gated`.
5. **Empty detail view** — capture as `--optional --condition empty-state`.

**Portability:** flow replay uses click locators. Avoid hardcoded entity IDs in `actions`; `screen.url` is capture evidence.

## Troubleshooting

| Symptom | Likely class | Fix |
|---------|--------------|-----|
| `Timeout 1ms exceeded` | Infra (fixed) | Use current skill; `--no-daemon` to debug |
| `profile_busy` (exit 4) | Concurrency | `close` session; don't parallel same slug |
| Click fails, goto works | Navigation | `goto` for routes; `click` for modals |
| Wrong screen after click | Hover/ambiguous | `hover` first; `--role` + `--name` |
| Create shows upsell | Account branch | `--optional --condition plan-gated` |
| `invalid state` | Schema | Use `[a-z][a-z0-9-]*` states or builtins |
| `auth_required` + profile exists | Stale session | `competitor-login --verify <feature-url>` |
| `discovery_required` exit 3 | Cold/starter flow | Complete discover → `save-flow` |
| Probe PNG only | Artifact | `save-flow --run-dir` promotes to canonical |
| Tempted to write script | Pipeline broken | Use discover CLI; file bug |

## Flow cache schema

```json
{
  "version": 1,
  "featureSlug": "add-task",
  "competitor": "competitor-a",
  "capabilityPattern": "create-resource",
  "startUrl": "https://...",
  "screens": [
    {
      "state": "main",
      "label": "...",
      "url": "https://...",
      "actions": [],
      "optional": false,
      "condition": "plan-gated",
      "navigationStrategy": "click",
      "successSignals": []
    }
  ]
}
```

**States:** builtins (`main`, `create`, `edit`, `empty`, `error`, `detail`, `confirm`, `success`) or any `[a-z][a-z0-9-]{0,31}`.

**Actions:** `click`, `hover`, `goto`, `fill`, `press`, `wait`

## Comparison report template

Save to `Outputs/competitor-research/{feature-slug}-{date}/{feature-slug}-comparison-{date}.md`.

Scaffold first: `npm run competitor-scaffold-report -- --manifest <run-dir>/capture-manifest.json`

```markdown
# Competitor comparison: [Feature name]

> **Date:** YYYY-MM-DD | **Competitors:** [slugs]

## Summary
[One or two sentences — headline takeaway.]

## Key insights
1. **[Claim]** — [evidence]. _(competitor)_

## Capability comparison
| Capability | [a] | [b] |
| [differentiator] | Yes — … ([doc](url)) | Partial — … |

## Flows
### [competitor] — [label]
| Step | State | Screenshot | Caption |
| 1 | main | ![main](screenshots/{competitor}-main.png) | [one line] |
```

## Discover CLI

```bash
npm run competitor-discover -- --cmd launch --competitor <slug> --feature "<name>" --url "<feature-url>"
npm run competitor-discover -- --cmd snapshot --session-id <id> --scroll
npm run competitor-discover -- --cmd click --session-id <id> --ref @e3
npm run competitor-discover -- --cmd hover --session-id <id> --role button --name "Edit"
npm run competitor-discover -- --cmd goto --session-id <id> --url "https://..."
npm run competitor-discover -- --cmd capture-screen --session-id <id> --state detail-view --run-dir <run-dir>
npm run competitor-discover -- --cmd capture-screen --session-id <id> --state plan-gate --optional --condition plan-gated --run-dir <run-dir>
npm run competitor-discover -- --cmd save-flow --session-id <id> --run-dir <run-dir>
npm run competitor-discover -- --cmd close --session-id <id>
```

## Pipeline warnings

`capture-manifest.json` includes `pipelineWarnings` when:
- Flow cache diverged from discover session (hand-edit)
- URL set without actions (non-portable replay)
- Probe PNG without canonical screenshot
- Report exists while discovery still required
