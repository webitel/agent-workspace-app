import { mount } from '@vue/test-utils';
import WebitelUI from '@webitel/ui-sdk';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { describe, expect, it } from 'vitest';

import { OutboundCallCardState } from '../../enums/OutboundCallCardState.enum';
import OutboundCallCard from '../outbound-call-card.vue';

type CardProps = InstanceType<typeof OutboundCallCard>['$props'];

function mountCard(props: Partial<CardProps> = {}) {
	return mount(OutboundCallCard, {
		props: {
			preview: {
				name: 'Emily Johnson',
				number: '+12023417842',
			},
			state: OutboundCallCardState.Ringing,
			isMuted: false,
			canToggleMute: true,
			...props,
		},
		global: {
			plugins: [
				[
					WebitelUI,
					{
						eventBus,
					},
				],
			],
		},
	});
}

function findButtonByText(wrapper: ReturnType<typeof mountCard>, text: string) {
	return wrapper.findAll('button').find((button) => button.text() === text);
}

describe('outbound-call-card', () => {
	it('shows who is being called', () => {
		const wrapper = mountCard();

		expect(wrapper.text()).toContain('Emily Johnson');
		expect(wrapper.text()).toContain('+12023417842');
	});

	it('shows only the number when the contact is unknown', () => {
		const wrapper = mountCard({
			preview: {
				number: '100',
			},
		});

		expect(wrapper.find('.outbound-call-card__name').exists()).toBe(false);
	});

	it('shows the ringing state with call controls', () => {
		const wrapper = mountCard();

		expect(wrapper.text()).toContain('ui.dialer.outboundCall.ringing');
		expect(
			wrapper
				.findComponent({
					name: 'RingingIndicator',
				})
				.exists(),
		).toBe(true);
		expect(wrapper.findAll('.wt-icon-btn')).toHaveLength(2);
	});

	it('hangs up from the ringing state', async () => {
		const wrapper = mountCard();

		await wrapper.findAll('.wt-icon-btn')[1].trigger('click');

		expect(wrapper.emitted('hangup')).toHaveLength(1);
	});

	it('toggles the microphone from the ringing state', async () => {
		const wrapper = mountCard();

		await wrapper.findAll('.wt-icon-btn')[0].trigger('click');

		expect(wrapper.emitted('toggleMute')).toHaveLength(1);
	});

	it('shows the no answer state with retry and back to dialpad', async () => {
		const wrapper = mountCard({
			state: OutboundCallCardState.NoAnswer,
		});

		expect(wrapper.text()).toContain('ui.dialer.outboundCall.noAnswer');
		expect(wrapper.text()).toContain(
			'ui.dialer.outboundCall.noAnswerDescription',
		);

		await findButtonByText(
			wrapper,
			'ui.dialer.outboundCall.retryCall',
		)?.trigger('click');
		await findButtonByText(
			wrapper,
			'ui.dialer.outboundCall.backToDialpad',
		)?.trigger('click');

		expect(wrapper.emitted('retry')).toHaveLength(1);
		expect(wrapper.emitted('backToDialpad')).toHaveLength(1);
	});
});
