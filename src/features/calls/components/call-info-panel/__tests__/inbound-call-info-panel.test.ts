import { mount } from '@vue/test-utils';
import { FormatDateMode, IconColor } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import CommunicationInfoFields from '../../../../../ui/sidebar/components/communication-info/communication-info-fields.vue';
import CommunicationInfoHeader from '../../../../../ui/sidebar/components/communication-info/communication-info-header.vue';
import type { CallInfoPanelContent } from '../../../types/CallInfoPanelContent.types';
import InboundCallInfoPanel from '../inbound-call-info-panel.vue';

const CREATED_AT = 1_700_000_000_000;
const ANSWERED_AT = CREATED_AT + 15_000;

const buildContent = (
	overrides: Partial<CallInfoPanelContent> = {},
): CallInfoPanelContent => ({
	direction: CallDirection.Inbound,
	from: '+12023417842',
	to: '1001',
	queueName: 'Sales',
	createdAt: CREATED_AT,
	answeredAt: ANSWERED_AT,
	...overrides,
});

// The header renders its slots for real, so the test sees what the call puts
// there; the fields only get their props checked.
const HeaderStub = {
	name: 'CommunicationInfoHeader',
	props: [
		'icon',
		'color',
		'title',
	],
	template:
		'<div><p class="subtitle"><slot name="subtitle" /></p><p class="aside"><slot name="aside" /></p></div>',
};

const mountPanel = (content: CallInfoPanelContent) =>
	mount(InboundCallInfoPanel, {
		props: {
			content,
		},
		global: {
			stubs: {
				CommunicationInfoHeader: HeaderStub,
				CommunicationInfoFields: true,
				WtDivider: true,
			},
		},
	});

describe('inbound-call-info-panel', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(ANSWERED_AT + 65_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the inbound header', () => {
		const wrapper = mountPanel(buildContent());

		expect(wrapper.findComponent(CommunicationInfoHeader).props()).toEqual({
			icon: 'ws-inbound-call',
			color: IconColor.SUCCESS,
			title: 'ui.call.direction.inbound',
		});
	});

	it('puts the start time under the title and the timer on the right', () => {
		const wrapper = mountPanel(buildContent());

		expect(wrapper.find('.subtitle').text()).toBe(
			`ui.reusable.startedAt: ${formatDate(CREATED_AT, FormatDateMode.TIME_SEC)}`,
		);
		expect(wrapper.find('.aside').text()).toBe('00:01:05');
	});

	it('leaves the start time and the timer out when the call has none', () => {
		const wrapper = mountPanel(
			buildContent({
				createdAt: undefined,
				answeredAt: undefined,
			}),
		);

		expect(wrapper.find('.subtitle').text()).toBe('');
		expect(wrapper.find('.aside').text()).toBe('');
	});

	it('shows From, To and Queue in this order', () => {
		const wrapper = mountPanel(buildContent());

		expect(
			wrapper.findComponent(CommunicationInfoFields).props('fields'),
		).toEqual([
			{
				key: 'from',
				label: 'reusable.from',
				value: '+12023417842',
			},
			{
				key: 'to',
				label: 'reusable.to',
				value: '1001',
			},
			{
				key: 'queue',
				label: 'objects.queue.queue',
				value: 'Sales',
			},
		]);
	});
});
