import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import type { CallPanelInfo } from '../../../types/CallPanelInfo.types';
import CallPanelInfoBlock from '../call-panel-info.vue';

/**
 * What the block shows is useCallPanelInfo's job (tested there); here only
 * that the block renders it.
 */
const CREATED_AT = 1_700_000_000_000;
const ANSWERED_AT = CREATED_AT + 15_000;

// wt-icon is registered globally by the ui-sdk plugin, which tests don't
// install: the stub is matched by name and stands in for it
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

describe('CallPanelInfo', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(ANSWERED_AT + 65_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders the header in the tone of the direction', () => {
		const wrapper = mountInfo(buildInfo());

		expect(wrapper.find('.call-panel-info--success').exists()).toBe(true);
		expect(wrapper.findComponent(WtIconStub).props()).toEqual({
			icon: 'ws-inbound-call',
			color: 'success',
		});
		expect(wrapper.find('.call-panel-info__title').text()).toBe(
			'ui.call.direction.inbound',
		);
		expect(wrapper.find('.call-panel-info__started-at').exists()).toBe(true);
		expect(wrapper.find('.call-panel-info__timer').text()).toBe('00:01:05');
	});

	it('renders a row per field as label and value', () => {
		const wrapper = mountInfo(buildInfo());

		expect(
			wrapper
				.findAll('.call-panel-info__row')
				.map((row) => `${row.find('dt').text()} ${row.find('dd').text()}`),
		).toEqual([
			'reusable.from: +12023417842',
			'reusable.to: 1001',
			'objects.queue.queue: Sales',
		]);
	});

	it('hides the start time and the timer the call does not have', () => {
		const wrapper = mountInfo(
			buildInfo({
				createdAt: undefined,
				answeredAt: undefined,
			}),
		);

		expect(wrapper.find('.call-panel-info__started-at').exists()).toBe(false);
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
