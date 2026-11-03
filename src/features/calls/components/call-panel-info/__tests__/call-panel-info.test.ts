import { mount } from '@vue/test-utils';
import { FormatDateMode } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import type { CallPanelInfo } from '../../../types/CallPanelInfo.types';
import CallPanelInfoBlock from '../call-panel-info.vue';

const CREATED_AT = 1_700_000_000_000;
const ANSWERED_AT = CREATED_AT + 15_000;

const WtIconStub = {
	name: 'WtIcon',
	props: [
		'icon',
		'color',
	],
	template: '<i class="wt-icon-stub" />',
};

const WtDividerStub = {
	name: 'WtDivider',
	template: '<hr />',
};

const buildInfo = (overrides: Partial<CallPanelInfo> = {}): CallPanelInfo => ({
	direction: CallDirection.Inbound,
	from: '+12023417842',
	to: '1001',
	queueName: 'Sales',
	createdAt: CREATED_AT,
	answeredAt: ANSWERED_AT,
	...overrides,
});

const mountInfo = (info: CallPanelInfo) =>
	mount(CallPanelInfoBlock, {
		props: {
			info,
		},
		global: {
			stubs: {
				WtIcon: WtIconStub,
				WtDivider: WtDividerStub,
			},
		},
	});

const rowTexts = (wrapper: ReturnType<typeof mountInfo>) =>
	wrapper
		.findAll('.call-panel-info__row')
		.map((row) => `${row.find('dt').text()} ${row.find('dd').text()}`);

describe('CallPanelInfo', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(ANSWERED_AT + 65_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the inbound call header with the time since it was answered', () => {
		const wrapper = mountInfo(buildInfo());

		expect(wrapper.findComponent(WtIconStub).props('icon')).toBe(
			'ws-inbound-call',
		);
		expect(wrapper.find('.call-panel-info--success').exists()).toBe(true);
		expect(wrapper.find('.call-panel-info__title').text()).toBe(
			'ui.call.direction.inbound',
		);
		expect(wrapper.find('.call-panel-info__started-at').text()).toBe(
			`ui.reusable.startedAt: ${formatDate(CREATED_AT, FormatDateMode.TIME_SEC)}`,
		);
		expect(wrapper.find('.call-panel-info__timer').text()).toBe('00:01:05');
	});

	it('shows the inbound fields in order', () => {
		const wrapper = mountInfo(buildInfo());

		expect(rowTexts(wrapper)).toEqual([
			'reusable.from: +12023417842',
			'reusable.to: 1001',
			'objects.queue.queue: Sales',
		]);
	});

	it('leaves out the rows the call does not have', () => {
		const wrapper = mountInfo(
			buildInfo({
				to: undefined,
				queueName: undefined,
			}),
		);

		expect(rowTexts(wrapper)).toEqual([
			'reusable.from: +12023417842',
		]);
	});

	it('hides the start time when the call has none', () => {
		const wrapper = mountInfo(
			buildInfo({
				createdAt: undefined,
			}),
		);

		expect(wrapper.find('.call-panel-info__started-at').exists()).toBe(false);
	});

	it('hides the timer when the call has no answer time', () => {
		const wrapper = mountInfo(
			buildInfo({
				answeredAt: undefined,
			}),
		);

		expect(wrapper.find('.call-panel-info__timer').exists()).toBe(false);
	});

	it('renders nothing for a direction without a view', () => {
		const wrapper = mountInfo(
			buildInfo({
				direction: CallDirection.Outbound,
			}),
		);

		expect(wrapper.find('.call-panel-info').exists()).toBe(false);
	});
});
