import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTabs: {
		name: 'WtTabs',
		props: [
			'current',
			'tabs',
		],
		emits: [
			'change',
		],
		template: `
			<nav>
				<button
					v-for="tab in tabs"
					:key="tab.value"
					type="button"
					@click="$emit('change', tab)"
				>{{ tab.text }}</button>
			</nav>
		`,
	},
}));

vi.mock(
	'../../../../../../features/calls/modules/missed-calls/components/the-missed-calls.vue',
	() => ({
		default: {
			name: 'TheMissedCalls',
			template: '<div class="the-missed-calls-stub" />',
		},
	}),
);

import TheCallsWorkspace from '../the-calls-workspace.vue';

describe('the-calls-workspace', () => {
	it('shows the Missed tab content by default', () => {
		const wrapper = mount(TheCallsWorkspace);

		expect(wrapper.find('.the-missed-calls-stub').exists()).toBe(true);
	});
});
