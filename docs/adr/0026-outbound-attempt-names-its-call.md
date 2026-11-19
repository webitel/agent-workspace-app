# 26. An outbound attempt is linked to its call by the ids the dial returns, elimination only without them

Date: 2026-11-19

## Status

Accepted. Implemented in [WS-155](https://webitel.atlassian.net/browse/WS-155).
Needs a `webitel-sdk` release that is not out yet (WTEL); until then the app
behaves as before.

## Context

An **Outbound attempt** exists before its `Call` does: the call reaches the SDK
list only on `Ringing`. `client.call()` in `webitel-sdk` 26.4.44 resolves with
nothing, so `linkAttemptsToCalls` matched by elimination: the first new
outbound call nobody owns. An attempt stuck in Dialing (the SDK swallows a
failed `phone.call()`) then adopts a call dialled later on a desk phone or in
another tab, and since WS-155 the call dock expands for that call. Raised in
review of WS-155.

Socket events go to the user, not to the tab, so the call list cannot tell
which tab dialled. Only the dial itself can say which call it placed.

A change to `webitel-sdk` makes `Client.call` resolve with
`OutboundCallResult { callId?, sipId? }`. It was checked live through
`npm link`:

- With a web phone, the dial resolves with `sipId` (the web phone's session
  id: the SIP Call-ID followed by the from-tag) about 250 ms before the call
  rings. `call.sipId` is a prefix of it. With two tabs dialling, each matched
  only its own call.
- Without a web phone, `call_invite` returns `callId`, equal to `Call.id`, but
  only once the agent's own leg answers, so `Ringing` arrives first. Not
  checked live.

## Decision

`callsStore.call` returns `DialedCallIds | null` (`null` when nothing was
placed). The attempt keeps the ids. `linkAttemptsToCalls` first gives an
attempt with ids only the call they name (`isDialedCall`: `callId` equal to
`call.id`, or `sipId` starting with `call.sipId`). It never adopts another call
by elimination, and a call it took by elimination before the ids came is
swapped for the named one. Attempts without ids (the request still open, or
an SDK that returns none) are matched by elimination as before, after the
attempts with ids, so they cannot take a call another attempt named.

The value `client.call()` resolves with is read as `unknown` through
`toDialedCallIds`. The installed SDK declares `void`, and a cast would hide
that. Anything other than an object of non-empty strings counts as no ids, so
the same code runs on 26.4.44 and on the new release.

## Considered options

- **A link deadline** (an attempt older than N seconds stops adopting calls).
  Tried in WS-155 and dropped: the value is a product decision, and a slow but
  healthy attempt still loses its call.
- **A correlation id sent with the dial and returned on the call's events.**
  The web phone path sends only `X-Webitel-Display` / `X-Webitel-Contact-Id`
  and drops `params.variables`, so it needs backend and SDK work. The ids the
  dial already has are enough.
- **Linking only after the request resolves.** Without a web phone the id comes
  after the answer, so the card would never show Ringing.

## Consequences

- Without a web phone, the attempt is still linked by elimination while it
  rings. The id only arrives after the answer, when the attempt has closed.
- A failed `phone.call()` still resolves without ids, like a dial with no web
  phone, so that attempt can still adopt a foreign call. Telling the two apart
  needs an `error` in `OutboundCallResult`.
- An attempt that has ids but whose call never comes (the web phone session
  fails after the dial) stays in Dialing. It no longer adopts a foreign call.
- When the SDK release is out: bump `webitel-sdk`. `toDialedCallIds` can then
  take `OutboundCallResult` instead of `unknown`.
