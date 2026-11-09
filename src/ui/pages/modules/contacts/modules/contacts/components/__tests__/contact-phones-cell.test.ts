import { mount } from '@vue/test-utils';
import type { ContactsPhoneNumber } from '@webitel/api-services/gen/models';
import { describe, expect, it, vi } from 'vitest';

import ContactPhonesCell from '../contact-phones-cell.vue';

/**
 * @author Oleksandr Palonnyi
 * `WtContextMenu` is a `defineAsyncComponent` in ui-sdk, which a `global.stubs`
 * entry does not replace, so the whole module is mocked as in contacts-table.test.ts
 * [WTEL-WS-27](https://webitel.atlassian.net/browse/WTEL-WS-27)
 */
vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		emits: [
			'click',
		],
		template: '<button class="call-button" @click="$emit(\'click\')" />',
	},
	WtContextMenu: {
		name: 'WtContextMenu',
		props: [
			'options',
		],
		emits: [
			'click',
		],
		template:
			'<div class="phones-menu"><slot name="activator" :toggle="() => {}" /></div>',
	},
	WtTooltip: {
		template: '<div><slot name="activator" /></div>',
	},
	WtChip: {
		template: '<span class="more-chip"><slot /></span>',
	},
	WtIcon: {
		template: '<i />',
	},
}));

const mountCell = (phones?: ContactsPhoneNumber[]) =>
	mount(ContactPhonesCell, {
		props: {
			phones,
		},
	});

describe('contact-phones-cell', () => {
	it('shows a placeholder and no call button when the contact has no phone', () => {
		const wrapper = mountCell([]);

		expect(wrapper.find('.call-button').exists()).toBe(false);
		expect(wrapper.text()).toContain('ui.pages.contacts.phones.noPhone');
	});

	it('shows the primary number, not the first one', () => {
		const wrapper = mountCell([
			{
				number: '111',
			},
			{
				number: '222',
				primary: true,
			},
		]);

		expect(wrapper.find('.contact-phones-cell__number').text()).toBe('222');
	});

	it('falls back to the first number when none is primary', () => {
		const wrapper = mountCell([
			{
				number: '111',
			},
			{
				number: '222',
			},
		]);

		expect(wrapper.find('.contact-phones-cell__number').text()).toBe('111');
	});

	it('calls the shown number on button click', async () => {
		const wrapper = mountCell([
			{
				number: '111',
			},
			{
				number: '222',
				primary: true,
			},
		]);

		await wrapper.find('.call-button').trigger('click');

		expect(wrapper.emitted('call')).toEqual([
			[
				'222',
			],
		]);
	});

	it('shows no counter for a single number', () => {
		const wrapper = mountCell([
			{
				number: '111',
			},
		]);

		expect(wrapper.find('.phones-menu').exists()).toBe(false);
	});

	it('counts the numbers besides the shown one', () => {
		const wrapper = mountCell([
			{
				number: '111',
			},
			{
				number: '222',
			},
			{
				number: '333',
			},
		]);

		expect(wrapper.find('.more-chip').text()).toBe('+2');
	});

	it('calls the number of the chosen menu row', () => {
		const wrapper = mountCell([
			{
				number: '111',
			},
			{
				number: '222',
			},
		]);

		wrapper
			.findComponent({
				name: 'WtContextMenu',
			})
			.vm.$emit('click', {
				option: {
					number: '222',
				},
			});

		expect(wrapper.emitted('call')).toEqual([
			[
				'222',
			],
		]);
	});

	it('ignores entries without a number', () => {
		const wrapper = mountCell([
			{},
			{
				number: '111',
			},
		]);

		expect(wrapper.find('.contact-phones-cell__number').text()).toBe('111');
		expect(wrapper.find('.phones-menu').exists()).toBe(false);
	});
});
