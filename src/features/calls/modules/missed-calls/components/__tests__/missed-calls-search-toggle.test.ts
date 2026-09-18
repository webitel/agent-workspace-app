import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtIconBtn: {
		name: 'WtIconBtn',
		props: [
			'icon',
		],
		emits: [
			'click',
		],
		template:
			'<button type="button" :data-icon="icon" @click="$emit(\'click\')" />',
	},
	WtSearchBar: {
		name: 'WtSearchBar',
		props: [
			'value',
			'placeholder',
		],
		emits: [
			'search',
		],
		template:
			'<input class="wt-search-bar-stub" @input="$emit(\'search\', $event.target.value)" />',
	},
}));

import MissedCallsSearchToggle from '../missed-calls-search-toggle.vue';

describe('missed-calls-search-toggle', () => {
	const mountToggle = () =>
		mount(MissedCallsSearchToggle, {
			props: {
				value: '',
			},
			global: {
				directives: {
					tooltip: {},
				},
			},
		});

	it('shows only the search icon until it is clicked', () => {
		const wrapper = mountToggle();

		expect(wrapper.find('[data-icon="search"]').exists()).toBe(true);
		expect(wrapper.find('.wt-search-bar-stub').exists()).toBe(false);
	});

	it('reveals the search field after the icon is clicked, and emits its input', async () => {
		const wrapper = mountToggle();

		await wrapper.find('[data-icon="search"]').trigger('click');
		expect(wrapper.find('.wt-search-bar-stub').exists()).toBe(true);

		await wrapper.find('.wt-search-bar-stub').setValue('jane');

		expect(wrapper.emitted('search')?.[0]).toEqual([
			'jane',
		]);
	});
});
