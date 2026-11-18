import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { mockT } from '../../../../../../test/setup';
import FoundContactsNavigator from '../found-contacts-navigator.vue';

const WtIconBtnStub = {
	name: 'WtIconBtn',
	props: [
		'icon',
	],
	emits: [
		'click',
	],
	template: '<button :data-icon="icon" @click="$emit(\'click\')" />',
};

const mountSwitcher = (props: { position: number; count: number }) =>
	mount(FoundContactsNavigator, {
		props,
		global: {
			stubs: {
				WtIconBtn: WtIconBtnStub,
			},
		},
	});

const findPrev = (wrapper: ReturnType<typeof mountSwitcher>) =>
	wrapper.find('.found-contacts-navigator__prev');

const findNext = (wrapper: ReturnType<typeof mountSwitcher>) =>
	wrapper.find('.found-contacts-navigator__next');

describe('found-contacts-navigator', () => {
	it('shows the position of the shown contact among the found ones', () => {
		const wrapper = mountSwitcher({
			position: 2,
			count: 3,
		});

		expect(wrapper.find('.found-contacts-navigator__label').text()).toBe(
			'ui.sidebar.contact.contactPosition',
		);
		expect(mockT).toHaveBeenCalledWith('ui.sidebar.contact.contactPosition', {
			current: 2,
			count: 3,
		});
	});

	it('shows both arrows in the middle of the list', () => {
		const wrapper = mountSwitcher({
			position: 2,
			count: 3,
		});

		expect(findPrev(wrapper).exists()).toBe(true);
		expect(findNext(wrapper).exists()).toBe(true);
	});

	it('hides the back arrow on the first contact', () => {
		const wrapper = mountSwitcher({
			position: 1,
			count: 3,
		});

		expect(findPrev(wrapper).exists()).toBe(false);
		expect(findNext(wrapper).exists()).toBe(true);
	});

	it('hides the forward arrow on the last contact', () => {
		const wrapper = mountSwitcher({
			position: 3,
			count: 3,
		});

		expect(findPrev(wrapper).exists()).toBe(true);
		expect(findNext(wrapper).exists()).toBe(false);
	});

	it('emits prev and next on the arrow clicks', async () => {
		const wrapper = mountSwitcher({
			position: 2,
			count: 3,
		});

		await findPrev(wrapper).trigger('click');
		await findNext(wrapper).trigger('click');

		expect(wrapper.emitted('prev')).toHaveLength(1);
		expect(wrapper.emitted('next')).toHaveLength(1);
	});
});
