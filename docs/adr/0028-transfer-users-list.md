# 28. The transfer popup's users list reads user statuses, and a user who is not an agent shows no status

Date: 2026-11-23

## Status

Accepted. Implemented by [WS-95](https://webitel.atlassian.net/browse/WS-95).

## Context

The Users tab (AC_13.07.06) lists the users a call can be blind-transferred
to, with their name, avatar and status, searched by name. Its status column
points to the same indicators as the Agents tab (AC_13.07.04): the agent
statuses (Online, Pause, Break out, Offline), the channel states, and DnD.

Not every user is an agent. A user with a desk phone and no agent profile is a
typical blind-transfer target and has no agent status at all.

## Decision

**The list is `AgentsAPI.getUsersStatus`, not `UsersAPI.getList`.** It is the
only endpoint that answers with the user's agent status, presence and
extension in one row: the status column reads the first two, and the blind
transfer to a user dials the extension. cc-workspaces listed this tab from the
same endpoint. Like the Agents and Queues lists (ADR-0016, ADR-0027) it is a
`createTableStore`; `transferUsersApiModule` requests `extension` and
`presence` on top of the header fields and leaves the user themself out by
`notUserId`, which the store passes, as an api module does not read stores.
It sends no sort of its own: AC_13.07.06 names none, and the Agents list does
not sort either, so both come in the backend's order.

**A Users row gets its status by the Agents rule** (`getTransferAgentStatus`):
DnD presence first, otherwise the agent status. A user who is not an agent and
is not in DnD shows no status.

**A blind transfer to a user dials their extension**, through the same
`blindTransfer` as a typed number, as cc-workspaces did. The popup holds only
the selected row's id, so it reads the row's extension from the Users tab's
store, which is alive while that tab is shown. Lifting the whole row into the
popup's selection was not done: it changes the contract of all three tabs for
one field.

**A user without an extension can be selected, but BLIND is disabled for
them.** The extension is set in Admin → Users and may be empty, and then there
is nothing to dial. BA answered for AC_13.07.10 that such a user cannot be
transferred to and the call stays with the agent; cc-workspaces already sent
nothing then, but left the button enabled. `getTransferActionAvailability`
takes whether the selected row has a destination, and the popup works it out
from the extension. The row still holds the buttons, so the number field's
pair stays disabled too, as for any selected row (AC_13.07.12).

**The three tab lists share one composable** (`useTransferTabList`): loading,
search, reset on unmount and the row selection, so a fix to any of them is
made once.

## Considered options

- **`UsersAPI.getList`.** Rejected: it has no agent status, and its presence
  and extension come as a heavier user model.
- **cc-workspaces' `getUserStatusByPriority`** for a user who is not an agent:
  DnD, then Busy, then Active when registered over SIP or web, otherwise
  Offline. Rejected for now: AC_13.07.04 has no Active or Busy for users, so it
  needs new statuses, their colours and labels, none of which the design
  defines. It is the first thing to revisit if BA wants a status on every row.

## Consequences

- A user who is not an agent shows an empty status cell whether or not their
  phone is registered.
- A user without an extension is listed like any other, and nothing on the row
  says why BLIND is disabled for them. Hiding such users or explaining the
  disabled button was not asked for.
- The popup depends on the Users tab's store for that one read. If the row
  ever needs more than the extension, lifting the selected row into the popup
  is the change to make.
- A slow answer to an older search can replace a newer one, as on the other
  tabs (ADR-0016).
