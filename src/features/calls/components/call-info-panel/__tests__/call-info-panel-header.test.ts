import { mount } from '@vue/test-utils';
import { FormatDateMode, IconColor } from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CallInfoPanelHeader from '../call-info-panel-header.vue';

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

const mountHeader = (
	props: Partial<{
		createdAt: number;
		answeredAt: number;
	}> = {},
) =>
	mount(CallInfoPanelHeader, {
		props: {
			icon: 'ws-inbound-call',
			tone: IconColor.SUCCESS,
			title: 'Inbound Call',
			createdAt: CREATED_AT,
			answeredAt: ANSWERED_AT,
			...props,
		},
		global: {
			stubs: {
				WtIcon: WtIconStub,
			},
		},
	});

describe('call-info-panel-header', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(ANSWERED_AT + 65_000);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the icon and the title in the given tone', () => {
		const wrapper = mountHeader();

		expect(wrapper.classes()).toContain('call-info-panel-header--success');
		expect(wrapper.findComponent(WtIconStub).props()).toEqual({
			icon: 'ws-inbound-call',
			color: IconColor.SUCCESS,
		});
		expect(wrapper.find('.call-info-panel-header__title').text()).toBe(
			'Inbound Call',
		);
	});

	it('shows when the call started', () => {
		const wrapper = mountHeader();

		expect(wrapper.find('.call-info-panel-header__started-at').text()).toBe(
			`ui.reusable.startedAt: ${formatDate(CREATED_AT, FormatDateMode.TIME_SEC)}`,
		);
	});

	it('counts the time since the call was answered', () => {
		const wrapper = mountHeader();

		expect(wrapper.find('.call-info-panel-header__timer').text()).toBe(
			'00:01:05',
		);
	});

	it('hides the start time and the timer the call does not have', () => {
		const wrapper = mountHeader({
			createdAt: undefined,
			answeredAt: undefined,
		});

		expect(wrapper.find('.call-info-panel-header__started-at').exists()).toBe(
			false,
		);
		expect(wrapper.find('.call-info-panel-header__timer').exists()).toBe(false);
	});
});
