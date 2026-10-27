import { defineStore, getActivePinia } from 'pinia';

/**
 * A setup store with one isolated instance per key (a chat, a task attempt),
 * stored in pinia as `${prefix}:${key}`.
 *
 * Definitions are cached by key, so repeated `use(key)` calls reuse one
 * defineStore wrapper rather than minting a fresh one each time. The cache is
 * also the registry: a key has a store exactly while it has an entry here.
 *
 * `args` reach `setup` only when `use` creates the store; later calls for the
 * same key get the existing store and their `args` are ignored.
 */
export function defineKeyedStore<
	Key extends string | number,
	Args extends unknown[],
	SetupStore,
>(prefix: string, setup: (key: Key, ...args: Args) => SetupStore) {
	const storeId = (key: Key) => `${prefix}:${key}`;

	const createStoreDefinition = (key: Key, args: Args) =>
		defineStore(storeId(key), () => setup(key, ...args));

	const storeDefinitions = new Map<
		Key,
		ReturnType<typeof createStoreDefinition>
	>();

	function use(key: Key, ...args: Args) {
		let useStore = storeDefinitions.get(key);
		if (!useStore) {
			useStore = createStoreDefinition(key, args);
			storeDefinitions.set(key, useStore);
		}
		return useStore();
	}

	/** Whether a key has a store, without creating one. */
	function has(key: Key) {
		return storeDefinitions.has(key);
	}

	/** Every key that has a store. */
	function keys() {
		return [
			...storeDefinitions.keys(),
		];
	}

	// $dispose() stops the scope but leaves a setup store's state in
	// pinia.state.value — delete it too, and drop the cached definition so a key
	// used again gets a fresh store, not a stale wrapper. A no-op for a key with
	// no store, so disposing never creates one only to throw it away.
	function dispose(key: Key) {
		const useStore = storeDefinitions.get(key);
		if (!useStore) return;
		useStore().$dispose();
		const pinia = getActivePinia();
		if (pinia) delete pinia.state.value[storeId(key)];
		storeDefinitions.delete(key);
	}

	return {
		use,
		has,
		keys,
		dispose,
	};
}
