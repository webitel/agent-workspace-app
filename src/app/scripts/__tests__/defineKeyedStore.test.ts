import { createPinia, getActivePinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { defineKeyedStore } from '../defineKeyedStore';

const defineCounters = () => {
	const setup = vi.fn((key: string, start: number) => {
		const count = ref(start);
		return {
			key,
			count,
		};
	});
	return {
		setup,
		counters: defineKeyedStore('counter', setup),
	};
};

describe('defineKeyedStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('keeps one store per key, under the prefixed id', () => {
		const { counters } = defineCounters();

		const first = counters.use('a', 1);
		const second = counters.use('b', 2);

		expect(first.$id).toBe('counter:a');
		expect(first.key).toBe('a');
		expect(first.count).toBe(1);
		expect(second.count).toBe(2);
		expect(getActivePinia()?.state.value['counter:b']).toBeDefined();
	});

	it('reuses the store for a key, ignoring later args', () => {
		const { counters, setup } = defineCounters();

		const first = counters.use('a', 1);
		first.count += 1;
		const again = counters.use('a', 100);

		expect(again).toBe(first);
		expect(again.count).toBe(2);
		expect(setup).toHaveBeenCalledTimes(1);
	});

	it('tells which keys have a store, without creating one', () => {
		const { counters, setup } = defineCounters();
		counters.use('a', 1);
		counters.use('b', 2);

		expect(counters.has('a')).toBe(true);
		expect(counters.has('c')).toBe(false);
		expect(counters.keys()).toEqual([
			'a',
			'b',
		]);
		expect(setup).toHaveBeenCalledTimes(2);
	});

	it('disposes a store with its pinia state, and starts fresh when used again', () => {
		const { counters } = defineCounters();
		const first = counters.use('a', 1);
		first.count = 5;

		counters.dispose('a');

		expect(counters.has('a')).toBe(false);
		expect(getActivePinia()?.state.value['counter:a']).toBeUndefined();
		expect(counters.use('a', 1).count).toBe(1);
	});

	it('disposes a key that never had a store without creating one', () => {
		const { counters, setup } = defineCounters();

		counters.dispose('never');

		expect(setup).not.toHaveBeenCalled();
		expect(getActivePinia()?.state.value['counter:never']).toBeUndefined();
	});
});
