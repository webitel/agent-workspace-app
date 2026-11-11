import { mount } from '@vue/test-utils';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';

import CommunicationInfoHeader from '../communication-info-header.vue';

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
	slots: Record<string, string> = {},
	color: IconColor = IconColor.SUCCESS,
) =>
	mount(CommunicationInfoHeader, {
		props: {
			icon: 'ws-inbound-call',
			color,
			title: 'Inbound Call',
		},
		slots,
		global: {
			stubs: {
				WtIcon: WtIconStub,
			},
		},
	});

describe('communication-info-header', () => {
	it('shows the icon and the title in the given color', () => {
		const wrapper = mountHeader();

		expect(wrapper.classes()).toContain('communication-info-header--success');
		expect(wrapper.findComponent(WtIconStub).props()).toEqual({
			icon: 'ws-inbound-call',
			color: IconColor.SUCCESS,
		});
		expect(wrapper.find('.communication-info-header__title').text()).toBe(
			'Inbound Call',
		);
	});

	it('takes the info color', () => {
		const wrapper = mountHeader({}, IconColor.INFO);

		expect(wrapper.classes()).toContain('communication-info-header--info');
		expect(wrapper.findComponent(WtIconStub).props('color')).toBe(
			IconColor.INFO,
		);
	});

	it('shows what the communication puts under the title and on the right', () => {
		const wrapper = mountHeader({
			subtitle: 'Started at: 09:36:04',
			aside: '00:01:05',
		});

		expect(wrapper.find('.communication-info-header__subtitle').text()).toBe(
			'Started at: 09:36:04',
		);
		expect(wrapper.find('.communication-info-header__aside').text()).toBe(
			'00:01:05',
		);
	});

	it('leaves no empty places when nothing is put there', () => {
		const wrapper = mountHeader();

		expect(wrapper.find('.communication-info-header__subtitle').exists()).toBe(
			false,
		);
		expect(wrapper.find('.communication-info-header__aside').exists()).toBe(
			false,
		);
	});
});
