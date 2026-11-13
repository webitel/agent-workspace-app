import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { OfflineMemberCommunication } from '../../types/OfflineMember.types';
import OfflineMemberPhonesCell from '../offline-member-phones-cell.vue';

// `WtContextMenu` is an async component in ui-sdk, which `global.stubs` does
// not replace, so the whole module is mocked as in contact-phones-cell.test.ts
vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		props: [
			'loading',
		],
		emits: [
			'click',
		],
		template: '<button class="call-button" @click="$emit(\'click\')" />',
	},
	WtContextMenu: {
		name: 'WtContextMenu',
		props: [
			'options',
			'disabled',
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

const communication = (
	id: number,
	destination: string,
): OfflineMemberCommunication => ({
	id,
	destination,
	channel: 'Phone',
	type: {
		id: 1,
		name: 'Mobile',
	},
});

const mountCell = (
	communications?: OfflineMemberCommunication[],
	loading = false,
) =>
	mount(OfflineMemberPhonesCell, {
		props: {
			communications,
			loading,
		},
	});

const menuOf = (wrapper: ReturnType<typeof mountCell>) =>
	wrapper.findComponent({
		name: 'WtContextMenu',
	});

describe('offline-member-phones-cell', () => {
	it('shows a placeholder and no call button without communications', () => {
		const wrapper = mountCell([]);

		expect(wrapper.find('.call-button').exists()).toBe(false);
		expect(wrapper.text()).toContain('ui.pages.contacts.phones.noPhone');
	});

	it('drops communications without a destination', () => {
		const wrapper = mountCell([
			communication(1, ''),
			communication(2, '222'),
		]);

		expect(wrapper.find('.offline-member-phones-cell__number').text()).toBe(
			'222',
		);
		expect(menuOf(wrapper).exists()).toBe(false);
	});

	it('emits the first communication on button click', async () => {
		const first = communication(1, '111');
		const wrapper = mountCell([
			first,
			communication(2, '222'),
		]);

		await wrapper.find('.call-button').trigger('click');

		expect(wrapper.emitted('call')).toEqual([
			[
				first,
			],
		]);
	});

	it('has no menu with a single communication', () => {
		const wrapper = mountCell([
			communication(1, '111'),
		]);

		expect(menuOf(wrapper).exists()).toBe(false);
	});

	it('counts the other communications on the chip', () => {
		const wrapper = mountCell([
			communication(1, '111'),
			communication(2, '222'),
			communication(3, '333'),
		]);

		expect(wrapper.find('.more-chip').text()).toBe('+2');
	});

	it('lists every communication by number only', () => {
		const wrapper = mountCell([
			communication(1, '111'),
			communication(2, '222'),
		]);

		expect(
			(
				menuOf(wrapper).props('options') as {
					text: string;
				}[]
			).map(({ text }) => text),
		).toEqual([
			'111',
			'222',
		]);
	});

	it('emits the communication picked in the menu', () => {
		const second = communication(2, '222');
		const wrapper = mountCell([
			communication(1, '111'),
			second,
		]);

		menuOf(wrapper).vm.$emit('click', {
			option: {
				communication: second,
			},
		});

		expect(wrapper.emitted('call')).toEqual([
			[
				second,
			],
		]);
	});

	describe('while a call is being requested', () => {
		it('shows the loader on the button and disables the menu', () => {
			const wrapper = mountCell(
				[
					communication(1, '111'),
					communication(2, '222'),
				],
				true,
			);

			expect(
				wrapper
					.findComponent({
						name: 'WtButton',
					})
					.props('loading'),
			).toBe(true);
			expect(menuOf(wrapper).props('disabled')).toBe(true);
		});

		it('emits nothing', async () => {
			const wrapper = mountCell(
				[
					communication(1, '111'),
					communication(2, '222'),
				],
				true,
			);

			await wrapper.find('.call-button').trigger('click');
			menuOf(wrapper).vm.$emit('click', {
				option: {
					communication: communication(2, '222'),
				},
			});

			expect(wrapper.emitted('call')).toBeUndefined();
		});
	});
});
