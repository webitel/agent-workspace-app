import { mount } from '@vue/test-utils';
import { FormatDateMode, IconColor } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import CommunicationInfoFields from '../../../../../../../ui/sidebar/components/communication-info/communication-info-fields.vue';
import CommunicationInfoHeader from '../../../../../../../ui/sidebar/components/communication-info/communication-info-header.vue';
import type { CallInfoPanelContent } from '../../../types/CallInfoPanelContent.types';
import OutboundCallInfoPanel from '../outbound-call-info-panel.vue';

const CREATED_AT = 1_700_000_000_000;
const ANSWERED_AT = CREATED_AT + 15_000;

const buildContent = (
	overrides: Partial<CallInfoPanelContent> = {},
): CallInfoPanelContent => ({
	direction: CallDirection.Outbound,
	from: '1001',
	to: '+12023417842',
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
	mount(OutboundCallInfoPanel, {
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

describe('outbound-call-info-panel', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(ANSWERED_AT + 65_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the outbound header', () => {
		const wrapper = mountPanel(buildContent());

		expect(wrapper.findComponent(CommunicationInfoHeader).props()).toEqual({
			icon: 'ws-outbound-call',
			color: IconColor.INFO,
			title: 'ui.call.direction.outbound',
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

	it('shows To and then From, without a queue', () => {
		const wrapper = mountPanel(
			buildContent({
				queueName: 'Sales',
			}),
		);

		expect(
			wrapper.findComponent(CommunicationInfoFields).props('fields'),
		).toEqual([
			{
				key: 'to',
				label: 'reusable.to',
				value: '+12023417842',
			},
			{
				key: 'from',
				label: 'reusable.from',
				value: '1001',
			},
		]);
	});

	it('passes absent numbers as undefined for the fields to hide them', () => {
		const wrapper = mountPanel(
			buildContent({
				to: undefined,
				from: undefined,
			}),
		);

		expect(
			wrapper.findComponent(CommunicationInfoFields).props('fields'),
		).toEqual([
			{
				key: 'to',
				label: 'reusable.to',
				value: undefined,
			},
			{
				key: 'from',
				label: 'reusable.from',
				value: undefined,
			},
		]);
	});
});
