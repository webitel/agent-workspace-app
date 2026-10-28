import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CallDockActions from '../call-dock-actions.vue';

const mountActions = (
	props: Partial<{
		isNumpadOpen: boolean;
		isMuted: boolean;
		isHold: boolean;
		canTransfer: boolean;
	}> = {},
) =>
	mount(CallDockActions, {
		props: {
			isNumpadOpen: false,
			isMuted: false,
			isHold: false,
			canTransfer: true,
			...props,
		},
		global: {
			stubs: {
				'wt-button': {
					props: [
						'icon',
						'iconColor',
					],
					template:
						'<button class="button"><i class="icon" :data-icon="icon" :data-color="iconColor" /></button>',
				},
			},
		},
	});

const findAction = (wrapper: ReturnType<typeof mountActions>, name: string) =>
	wrapper.find(`[aria-label="ui.call.activeCall.actions.${name}"]`);

describe('call-dock-actions', () => {
	it('labels every action for assistive technology', () => {
		const wrapper = mountActions();

		for (const name of [
			'numpad',
			'mute',
			'hold',
			'transfer',
			'hangup',
		]) {
			expect(findAction(wrapper, name).exists()).toBe(true);
		}
	});

	it('emits the matching event from each action', async () => {
		const wrapper = mountActions();

		await findAction(wrapper, 'numpad').trigger('click');
		await findAction(wrapper, 'mute').trigger('click');
		await findAction(wrapper, 'hold').trigger('click');
		await findAction(wrapper, 'hangup').trigger('click');

		expect(wrapper.emitted('toggleNumpad')).toHaveLength(1);
		expect(wrapper.emitted('toggleMute')).toHaveLength(1);
		expect(wrapper.emitted('toggleHold')).toHaveLength(1);
		expect(wrapper.emitted('hangup')).toHaveLength(1);
	});

	it('shows the muted icon while the call is muted', () => {
		const wrapper = mountActions({
			isMuted: true,
		});

		expect(
			findAction(wrapper, 'mute').find('[data-icon="mic-muted"]').exists(),
		).toBe(true);
	});

	it('reports the state of the toggle actions through aria-pressed', () => {
		const wrapper = mountActions({
			isHold: true,
		});

		expect(findAction(wrapper, 'hold').attributes('aria-pressed')).toBe('true');
		expect(findAction(wrapper, 'mute').attributes('aria-pressed')).toBe(
			'false',
		);
		expect(
			findAction(wrapper, 'hangup').attributes('aria-pressed'),
		).toBeUndefined();
	});

	it('disables transfer when the call cannot be transferred', () => {
		const wrapper = mountActions({
			canTransfer: false,
		});

		expect(
			findAction(wrapper, 'transfer').attributes('disabled'),
		).toBeDefined();
	});

	it('emits transfer without marking the action pressed', async () => {
		const wrapper = mountActions();

		await findAction(wrapper, 'transfer').trigger('click');

		expect(wrapper.emitted('transfer')).toHaveLength(1);
		expect(
			findAction(wrapper, 'transfer').attributes('aria-pressed'),
		).toBeUndefined();
	});
});
