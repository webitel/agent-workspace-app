import { computed, getCurrentScope, onScopeDispose, readonly } from 'vue';
import { WebSocketClientEvent } from '../enums/WebSocketClientEvent.enum';
import {
	client,
	connect,
	destroyClient,
	type EventMap,
	getAgentSession,
	getClient,
	latency,
	state,
	on as subscribeToEvent,
} from '../webSocketClientManager';

/**
 * Vue composable over the singleton manager. Reactive state is shared
 * module-level (the connection is process-wide), not per call. We expose only
 * the observed sub-objects as computeds — the rest of the Client is imperative.
 * Slices are `undefined` until the instance exists, then track its reactive
 * store; they re-resolve if the instance is swapped (logout -> re-login).
 */

// allCall()/allConversations() iterate the reactive Maps, so these recompute on
// add/remove (per-entity field changes bind via the reactive Call/Conversation).
const calls = computed(() => client.value?.allCall());
const conversations = computed(() => client.value?.allConversations());

// populated by getAgentSession(); undefined until then.
const agent = computed(() => client.value?.agent);

const readonlyState = readonly(state);

export function useWebSocketClient() {
	// auto-remove the listener when the caller's effect scope is disposed
	function on<K extends keyof EventMap>(
		event: K,
		cb: EventMap[K] | EventMap[K][],
	): () => void {
		const off = subscribeToEvent(event, cb);
		if (getCurrentScope()) onScopeDispose(off);
		return off;
	}

	return {
		// reactive
		state: readonlyState,
		calls,
		conversations,
		agent,

		// domain operation: seals access to the private SDK latency() (WTEL-8733)
		latency,

		// imperative
		getClient,
		getAgentSession,
		connect,
		destroyClient,
		on,
		Event: WebSocketClientEvent,
	};
}
