# 4. Processing form values live on the SDK task; a per-attempt store holds only UI state

Date: 2026-09-24

## Status

Accepted. Implemented alongside
[WS-7](https://webitel.atlassian.net/browse/WS-7).

## Context

A processing form arrives on the SDK `Task` (`task.form`) — on bridge, by a
`form` event, on transfer — and is replaced wholesale by `setForm()` whenever the
backend sends the next one. The `Task` objects in `client.allTask()` are
reactive, so anything written onto them re-renders.

Around the form there is state the SDK does not model: whether an action is
being submitted, the last failure, and the post-processing countdown with its
renew control. That state belongs to one attempt, has to survive the agent
flipping between chats, and must not bleed from one chat into another. The chat
window reuses a single component instance across chats, so component-local
state would leak.

The same form will later be shown for calls, which have no thread.

## Decision

**Field values are written onto the SDK form itself.** A change sets the body
element's `value` and refreshes `form.fields` with the backend-ready payload, for
every channel. Submitting sends `formAction(action.id, form.fields)`. There is
no copy of the values anywhere else.

**Everything else lives in a store per task attempt, keyed by `task.id`.** It is
created and disposed by the owning coordinator (the chats store for chats) when
the task enters and leaves the SDK feed — the SDK drops it at `wrap_time` —
never by components. It holds `isSubmitting`, the last error, and the
post-processing countdown with `renew()`.

## Alternatives considered

**Draft values in the store, the SDK form left untouched.** Cleaner in isolation
— no mutation of SDK objects, no "is this form initialised" flag — and it was
the first proposal. Rejected: the SDK form is what the backend persists
(`saveForm` sends the form and its fields, and `processing_autosave` builds on
that), what `formAction` falls back to, and what survives as long as the task
does. A second copy would need re-seeding on every `setForm()` and would drift
from what the backend saves.

**Keying by thread.** Chats reach their task by thread id, but the form belongs
to the attempt: a transfer or re-offer gives the same thread a new attempt and
a new form, and calls have no thread at all.

## Consequences

`form.fields` is always current, including for chats — `cc-workspaces` only kept
it current for calls, so a chat submit could send stale backend `fields` over
what the agent typed. Autosave, when it comes, is a debounced `saveForm()` in the
same store with nothing to reconcile.

Values are only as durable as the SDK task: a page reload brings the task back
from the backend but not unsaved input, same as `cc-workspaces`, until autosave
lands.

A component that renders the form must not cache values locally; it reads and
writes the SDK form, and reads everything else from the attempt's store.
