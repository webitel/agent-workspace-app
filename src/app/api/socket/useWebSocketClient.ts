import { computed, readonly } from 'vue';
import { WebSocketClientEvent } from './enums/WebSocketClientEvent.enum';
import {
	client,
	connect,
	destroyClient,
	getAgentSession,
	getClient,
	getCliInstance,
	on,
	state,
} from './webSocketClient';

/* ============================================================================
 * useWebSocketClient
 *
 * Thin Vue layer over the singleton manager (`webSocketClient.ts`). The Client
 * is a large library class, so we do NOT expose it as one big reactive object:
 * most of its surface is consumed imperatively (connect, auth, call,
 * subscribeCall, on, ...). Only the sub-objects modules actually observe are
 * exposed reactively, as computeds derived from the `client` shallowRef.
 *
 * The slices resolve to `undefined` until the instance exists (`getClient` /
 * `connect`), then track their underlying reactive store. Because reconnects
 * reuse the same instance, the proxy identity is stable across reconnects;
 * because `client` is a ref, the computeds re-resolve if the instance is
 * swapped (logout -> re-login).
 * ========================================================================== */

// callStore / conversationStore are private on Client but wrapped with
// reactive() at creation; read them through the (reactive) instance.
const callStore = computed(() => {
	// @ts-expect-error private; wrapped reactive in createClient
	return client.value?.callStore;
});

const conversationStore = computed(() => {
	// @ts-expect-error private; wrapped reactive in createClient
	return client.value?.conversationStore;
});

// `agent` is populated by getAgentSession(); undefined until then.
const agent = computed(() => client.value?.agent);

const readonlyClient = readonly(client);
const readonlyState = readonly(state);

export function useWebSocketClient() {
	return {
		// reactive primitives
		client: readonlyClient,
		state: readonlyState,

		// reactive slices (observe in templates/computed/watch)
		callStore,
		conversationStore,
		agent,

		// instance access + lifecycle (imperative)
		getClient,
		getAgentSession,
		connect,
		getCliInstance,
		destroyClient,

		on,
		Event: WebSocketClientEvent,
	};
}
