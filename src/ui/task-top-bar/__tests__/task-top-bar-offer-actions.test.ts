import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TaskTopBarOfferActions from '../task-top-bar-offer-actions.vue';

const WtButtonStub = {
	props: [
		'disabled',
		'loading',
		'color',
	],
	template:
		'<button :class="color" :disabled="disabled" :data-loading="loading"><slot /></button>',
};

const mountActions = (pending?: 'accept' | 'decline') =>
	mount(TaskTopBarOfferActions, {
		props: {
			pending,
		},
		global: {
			stubs: {
				WtButton: WtButtonStub,
			},
		},
	});

describe('task-top-bar-offer-actions', () => {
	it('emits accept and decline', async () => {
		const actions = mountActions();

		await actions.find('.success').trigger('click');
		await actions.find('.error').trigger('click');

		expect(actions.emitted('accept')).toHaveLength(1);
		expect(actions.emitted('decline')).toHaveLength(1);
	});

	it('locks both buttons while an action runs', () => {
		const buttons = mountActions('accept').findAll('button');

		expect(buttons.every((button) => button.element.disabled)).toBe(true);
	});

	it('shows progress on the pressed button only', () => {
		const actions = mountActions('decline');

		expect(actions.find('.success').attributes('data-loading')).toBe('false');
		expect(actions.find('.error').attributes('data-loading')).toBe('true');
	});

	it('leaves both buttons free when nothing runs', () => {
		const buttons = mountActions().findAll('button');

		expect(buttons.some((button) => button.element.disabled)).toBe(false);
	});
});
