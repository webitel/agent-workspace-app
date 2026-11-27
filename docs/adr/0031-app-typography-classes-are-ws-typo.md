# 31. The app's typography classes are `ws-typo-*`; the styleguide's `typo-*` only change their font

Date: 2026-11-27

## Status

Accepted, temporary. Supersedes [ADR-0024](0024-work-sans-typography-override.md).
[WS-82](https://webitel.atlassian.net/browse/WS-82).

## Context

ADR-0024 redefined the styleguide's `typo-*` classes by name with the Work Sans
values from the "New-WorkSpace" Figma file. Those classes are not only the app's:
`@webitel/ui-sdk` components put them in their own templates (`wt-label` is
`typo-subtitle-2`, the field of `wt-input-text` is `typo-body-1`). The Figma tokens
of the same name have other sizes, so every library component was resized with
them: `wt-label` went from 12px/500 to 16px/400, while the design keeps it at
12px/500.

## Decision

`src/app/css/typography.css` holds two things, both in the `wt-typography` layer
after the styleguide:

- **`ws-typo-*`** — the Figma typography (H1–H6, Subtitle-1/2, Body-1/2 + bold,
  Caption + bold, Overline) under the app's own prefix, used by the app's
  components. Values and the name mapping are as ADR-0024 set them.
- **The styleguide's `typo-*`, font only** — one rule sets `font-family` to
  Work Sans (Montserrat as the Cyrillic fallback) and nothing else, so `wt-*`
  components keep the styleguide's sizes, weights and line heights in the new
  font.

The app uses `ws-typo-*` only, never a bare `typo-*`.

## Considered options

- **Keep the names, scope the sizes to the app's elements** (for example
  `.typo-body-1:not([class*="wt-"])`). Rejected: library components also put
  `typo-*` on inner elements without a `wt-` class, which would still be resized,
  and the rule would be invisible at the call site.
- **Alias Work Sans as `Montserrat` in `@font-face`.** Changes the font only, so it
  does not solve the size clash, and it hides which font is really rendered.

## Consequences

- Text in `wt-*` components returns to the styleguide's sizes (for example the
  field of `wt-input-text` to 14px/400) and each such screen needs checking
  against its design.
- PrimeVue tokens and the `WtTypography` enum are still not overridden, as in
  ADR-0024.
- When the styleguide ships the new tokens, this file goes and `ws-typo-*` are
  renamed to whatever the styleguide names them.
