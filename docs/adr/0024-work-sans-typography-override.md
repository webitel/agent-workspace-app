# 24. The new Work Sans typography overrides the styleguide's `typo-*` classes locally, by name, with Montserrat as the Cyrillic fallback

Date: 2026-11-18

## Status

Accepted, temporary. Source: the Typography section of the "New-WorkSpace"
Figma file (node 7854:49976).

## Context

The `typo-*` classes and the Montserrat font come from `@webitel/styleguide`
(26.12.8), which has no Work Sans and none of the new tokens. The design moved
to Work Sans with new values: H1–H6, Subtitle-1/2, Body-1/2 (+ bold), Caption
(+ bold, italic), Overline.

## Decision

`src/app/css/typography.css`, imported after the styleguide, redefines the
`typo-*` classes in the styleguide's own `wt-typography` layer (so PrimeVue and
component styles still win). Work Sans is served the way the styleguide serves
Montserrat: `src/app/css/fonts.css` holds one `@font-face` per weight, over woff2
files in `src/app/assets/fonts/work-sans/` (latin and latin-ext subsets), and each
class sets its own `font-family`. No font package is a dependency. All of it is
meant to be deleted once the styleguide carries the same tokens.

The styleguide also repeats these values as PrimeVue tokens
(`lib/primevue/semantic/sizes/typography`) and in the `WtTypography` enum. Those
are not overridden here, so `@webitel/ui-sdk` components that take typography
from PrimeVue keep the old values until the styleguide is updated.

- **Mapped by name, not by size.** `typo-body-1` is now the Figma Body-1, which
  is 12px light where the old class was 14px; the old 14px is `typo-body-2`.
  Text at call sites changes size accordingly and each screen needs checking
  against its design. Mapping by size was the rejected alternative.
- `typo-heading-5` and `typo-heading-6` are new. `typo-button--*` is not in the
  design and stays as the styleguide has it.
- Letter spacing `-1` in Figma is -1% (`-0.14px` at 14px), written `-0.01em`.
- **Work Sans has no Cyrillic.** Ukrainian text falls back per glyph to
  Montserrat, which the styleguide already loads, so UK strings render in a mix
  of the two until the design settles a Cyrillic font.
- Overline is written as 12/16 regular, not uppercase, as in the Figma sample;
  the styleguide's was uppercase.

## Consequences

Two sources of typography exist until the styleguide is updated; a change there
will be hidden by this file.
