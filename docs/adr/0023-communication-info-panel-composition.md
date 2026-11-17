# 20. A communication's info block is composed: one component per variant, built from a shared header and fields, not rendered from a config

Date: 2026-11-13

## Status

Accepted, recorded after the fact. Implemented in
[WS-93](https://webitel.atlassian.net/browse/WS-93) (US_13.06, inbound call)
and [WS-107](https://webitel.atlassian.net/browse/WS-107) (US_16.03, outbound
call). Chats (US_06.03) and email are expected to follow it.

## Context

The Call window's right panel opens with a block about the communication
itself: an icon and title for its kind, a line under the title, something on
the right, and a few "label: value" lines below a divider.

The variants differ in more than their data:

- an inbound call shows From, To and Queue, with a green icon; an outbound one
  shows To before From and no Queue, with a blue one;
- a call shows when it started under the title and a running timer on the
  right, once answered;
- a chat (US_06.03) will show its own lines, and an email is planned with a
  message count where a call has its timer;
- a line the communication has no value for is hidden, not shown empty; a
  number masked by `hideNumber` still counts as a value.

The first version described the block as a config per direction: which
fields, in what order, with which icon and color, turned into rows by a
computed and rendered by one component. In review it proved hard to read and
to debug, and every difference between variants beyond data (a timer, an
email's message count) would have had to go into the config too.

## Decision

**Two shared building blocks, under `ui/sidebar/components/communication-info`.**

- `communication-info-header` takes `icon`, `color` and `title`, and has a
  `subtitle` slot and an `aside` slot. What goes in the slots is the
  variant's: a call's start time and timer, later an email's message count.
  `color` paints both the bar on top and the box behind the icon.
- `communication-info-fields` takes a list of `{ key, label, value }` and
  leaves out the ones without a value. Each line's value can be replaced
  through a `value-<key>` slot, for a line that needs more than text (a chip,
  a copy action). `key` is stable, so it keys the list and names the slot.

**One component per variant**, which arranges the shared blocks itself:
`inbound-call-info-panel`, `outbound-call-info-panel`. Each decides its icon,
color, fields and their order, and holds its own state, such as the answered
call's timer.

**The variant is picked from a `Record`.** `call-info-panel` maps
`CallDirection` to its component, so a direction without a panel is a type
error; a call without a known direction shows nothing.

**A mapper turns the SDK object into plain content first.**
`toCallInfoPanelContent` gives `CallInfoPanelContent`, with an absent value as
`undefined` and the number masked where `hideNumber` asks for it. The panels
render that and never read the `Call` itself.

**Config is for data only.** A list of fields with their values is fine; which
component to render, its markup and its behaviour are not put into config.

## Considered options

- **One component rendering every variant from a config** (the first
  version). Readable while variants differ only in data; a difference in
  layout or behaviour needs a flag, and what a variant renders can only be
  worked out by running its config through the computed in one's head.
- **A `call-info-header` with the start time and the timer built in**, shared
  by the two call panels on top of `communication-info-header`. Not taken when
  the outbound panel was added: the inbound panel was left untouched, and the
  repeated part is small. Worth revisiting if a third call variant appears.
- **The building blocks inside `features/calls`.** They are not about calls: a
  chat's and an email's panels use them too, so they live with the sidebar's
  shared components.

## Consequences

- A new communication (chat, email) adds its own panel component and a
  mapper, and reuses the header and fields; nothing shared needs a flag for it.
- The two call panels repeat their start time and timer code.
- Field values are strings. A richer value goes through its `value-<key>`
  slot rather than through the field list.
- Naming: the prop is `color`, display mappers are `to<X>Content` returning
  `<X>Content`, and non-table lists are fields, not rows.
