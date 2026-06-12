import { computed, getCurrentScope, onScopeDispose, readonly } from 'vue';
import { WebSocketClientEvent } from './enums/WebSocketClientEvent.enum';
import {
	client,
	connect,
	destroyClient,
	type EventMap,
	getAgentSession,
	getClient,
	getCliInstance,
	state,
	on as subscribeToEvent,
} from './webSocketClient';

/* ============================================================================
 * useWebSocketClient
 *
 * Vue composable over the singleton manager (`webSocketClient.ts`).
 *
 * The connection state is a process-wide singleton, so the reactive bits
 * (state, slices) are shared module-level refs/computeds rather than recreated
 * per call. What makes this a composable — and not just a getter — is the
 * lifecycle binding: event listeners registered through the returned `on` are
 * automatically removed when the caller's effect scope (component setup, store,
 * watcher) is disposed, so consumers never leak handlers on unmount.
 *
 * The Client is a large library class, so we do NOT expose it as one big
 * reactive object: most of its surface is consumed imperatively (connect, auth,
 * call, subscribeCall, ...). Only the sub-objects modules observe are exposed
 * reactively, as computeds derived from the `client` shallowRef.
 *
 * Slices resolve to `undefined` until the instance exists (`getClient` /
 * `connect`), then track their underlying reactive store. Because reconnects
 * reuse the same instance, identity is stable across reconnects; because
 * `client` is a ref, the computeds re-resolve if the instance is swapped
 * (logout -> re-login).
 * ========================================================================== */

// `calls` / `conversations` read the public allCall() / allConversations()
// accessors — they iterate the reactive callStore / conversationStore Maps, so
// the computeds re-evaluate when entries are added/removed. (Per-entity field
// changes update bindings directly via the reactive Call / Conversation.)
const calls = computed(() => client.value?.allCall());
const conversations = computed(() => client.value?.allConversations());

// `agent` is populated by getAgentSession(); undefined until then.
const agent = computed(() => client.value?.agent);

const readonlyClient = readonly(client);
const readonlyState = readonly(state);

export function useWebSocketClient() {
	// Track this caller's subscriptions and tear them down when its effect
	// scope is disposed (component unmount, store dispose, watcher stop).
	const disposers: Array<() => void> = [];

	function on<K extends keyof EventMap>(
		event: K,
		cb: EventMap[K] | EventMap[K][],
	): () => void {
		const off = subscribeToEvent(event, cb);
		disposers.push(off);
		return off;
	}

	if (getCurrentScope()) {
		onScopeDispose(() => {
			for (const off of disposers) off();
			disposers.length = 0;
		});
	}

	return {
		// reactive primitives
		client: readonlyClient,
		state: readonlyState,

		// reactive slices (observe in templates/computed/watch)
		calls,
		conversations,
		agent,

		// instance access + lifecycle (imperative)
		getClient,
		getAgentSession,
		connect,
		getCliInstance,
		destroyClient,

		// scope-bound event subscription (auto-removed on scope dispose)
		on,
		Event: WebSocketClientEvent,
	};
}
