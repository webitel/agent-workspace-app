# Writing module docs for agent-workspace-app

How a Claude doc for a domain or module is written and kept in this repo. Adapted from the
same convention in `cc-workspaces` (`docs/claude/how-to-write-claude-docs.md`), with two
changes: this repo's `app/` + `features/` + `ui/` layout, and no `.md` files under `src/` —
discovery goes through path-scoped rules instead of nested `CLAUDE.md` stubs.

These docs exist for Claude (and the next developer), not for release notes. They must be
picked up on their own, without anyone remembering to point at them.

## Discovery mechanics — these dictate the layout

- The root `CLAUDE.md` is loaded every session, so it stays thin: rules, not domain facts.
- A file under `.claude/rules/` with `paths:` frontmatter is loaded only when Claude works
  with files matching those globs (a rule without `paths` loads every session — don't).
- An `@path` import inside `CLAUDE.md` loads that file **always**. Wrong for domain docs.
  Whether `@` imports inside rules load lazily is undocumented, so rules name the doc as
  plain text instead.
- A file under `docs/claude/` is loaded by no mechanism at all; it is reached only through a
  rule that names it. A doc without a rule is invisible.

## Layout

```
CLAUDE.md                                 thin: rules, including "keep module docs current"
docs/claude/<domain>.md                   the domain doc itself
docs/claude/how-to-write-module-docs.md   this file
.claude/rules/<domain>.md                 path-scoped pointer to the domain doc
```

Nothing documentation-related lives under `src/`.

A domain usually spans several paths — logic in `src/features/<area>/`, UI in
`src/ui/<module>/` or `src/ui/pages/modules/<area>/`. Write the doc **once** in
`docs/claude/<domain>.md`, named the way the code names the domain (`calls.md`), and list
every path it touches in its rule:

```markdown
---
paths:
  - "src/features/<area>/**"
  - "src/ui/<module>/**"
---

The <domain> domain is documented in one place: `docs/claude/<domain>.md`.
Read it before changing these files, and update it in the same change when
behaviour, a design decision, a known problem or an open question changes.
```

The rule carries the pointer and nothing else: a fact in a rule is a second copy that
drifts. Shared, channel-neutral modules (`ui/notifications`) are not listed under one
domain's rule — no single domain owns them.

`.claude/` is currently excluded from git locally (`.git/info/exclude`), so the rules work
only on the machine that has them; `docs/claude/` is committed.

## Granularity

One file per domain; a new file only when an existing one stops being readable.

- A feature inside one domain is a section of that domain's doc, until the doc passes
  ~150 lines; then split into `docs/claude/<domain>-<feature>.md`, linked from the domain doc.
- A feature spanning several domains gets one doc, under the domain that owns most of the
  logic; the other domains' paths go into that doc's rule.
- Something not about code in one place (a convention, a workflow) is not a domain doc: it
  goes to `docs/` itself and, if it must fire every session, one line in the root `CLAUDE.md`.

## What goes into a doc

What the code cannot tell on its own:

- traps — where an obvious-looking assumption is wrong (SDK quirks, backend behaviour);
- why something is built the way it is, when the reason is not visible locally — especially
  where we deliberately diverge from `cc-workspaces`;
- the division of responsibility between stores, composables, SDK and UI;
- which user story / AC the module implements and what is still open;
- known problems and unverified assumptions, with a date.

Leave out what a `Grep` answers in a second: action lists, signatures, file inventories.

## Format

- Open with the date and the branch the observations come from, plus a line telling the
  reader to verify against the code before asserting anything.
- Under ~150 lines. English.
- One **fact**, one place — not repeated in the root `CLAUDE.md`, another doc or memory.

## Keeping it current

- Update the doc in the same change as the code it describes; bump the date/branch line.
- When an assumption is verified (or disproved), move it out of "open questions".
- Before finishing: every claim checked against the current code; the domain's rule lists
  every `src/` path the domain touches and names the right doc.
