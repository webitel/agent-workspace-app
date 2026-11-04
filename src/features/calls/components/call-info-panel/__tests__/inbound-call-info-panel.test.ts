import { mount } from '@vue/test-utils';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import type { CallInfoPanelContent } from '../../../types/CallInfoPanelContent.types';
import CallInfoPanelFields from '../call-info-panel-fields.vue';
import CallInfoPanelHeader from '../call-info-panel-header.vue';
import InboundCallInfoPanel from '../inbound-call-info-panel.vue';

const content: CallInfoPanelContent = {
	direction: CallDirection.Inbound,
	from: '+12023417842',
	to: '1001',
	queueName: 'Sales',
	createdAt: 1_700_000_000_000,
	answeredAt: 1_700_000_015_000,
};

const mountPanel = () =>
	mount(InboundCallInfoPanel, {
		props: {
			content,
		},
		global: {
			stubs: {
				CallInfoPanelHeader: true,
				CallInfoPanelFields: true,
				WtDivider: true,
			},
		},
	});

describe('inbound-call-info-panel', () => {
	it('shows the inbound header', () => {
		const wrapper = mountPanel();

		expect(wrapper.findComponent(CallInfoPanelHeader).props()).toEqual({
			icon: 'ws-inbound-call',
			tone: IconColor.SUCCESS,
			title: 'ui.call.direction.inbound',
			createdAt: content.createdAt,
			answeredAt: content.answeredAt,
		});
	});

	it('shows From, To and Queue in this order', () => {
		const wrapper = mountPanel();

		expect(wrapper.findComponent(CallInfoPanelFields).props('fields')).toEqual([
			{
				label: 'reusable.from',
				value: '+12023417842',
			},
			{
				label: 'reusable.to',
				value: '1001',
			},
			{
				label: 'objects.queue.queue',
				value: 'Sales',
			},
		]);
	});
});
