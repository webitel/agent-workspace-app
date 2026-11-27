import { mount } from '@vue/test-utils';
import { IconColor } from '@webitel/ui-sdk/enums';
import { describe, expect, it, vi } from 'vitest';

import CommunicationCellList from '../communication-cell-list.vue';

/**
 * `WtContextMenu` is a `defineAsyncComponent` in ui-sdk, which a `global.stubs`
 * entry does not replace, so the module is mocked as in contact-phones-cell.test.ts
 */
vi.mock('@webitel/ui-sdk/components', () => ({
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
			'<div class="menu"><slot name="activator" :toggle="() => {}" /><slot name="option" v-bind="options[0]" /></div>',
	},
	WtTooltip: {
		template:
			'<div class="tooltip"><slot name="activator" /><span class="tooltip-text"><slot /></span></div>',
	},
	WtChip: {
		template: '<span class="more-chip"><slot /></span>',
	},
}));

const mountList = (
	props: {
		value?: string;
		options?: string[];
		disabled?: boolean;
	},
	slots: Record<string, string | ((props: { count: number }) => string)> = {},
) =>
	mount(CommunicationCellList, {
		props: {
			icon: 'ws-chat',
			iconColor: IconColor.CHAT,
			...props,
		},
		slots,
		global: {
			stubs: {
				'wt-icon': {
					props: [
						'icon',
						'color',
					],
					template: '<i class="icon" :data-icon="icon" :data-color="color" />',
				},
			},
		},
	});

const menuOf = (wrapper: ReturnType<typeof mountList>) =>
	wrapper.findComponent({
		name: 'WtContextMenu',
	});

describe('communication-cell-list', () => {
	it('shows the column icon and the value', () => {
		const wrapper = mountList({
			value: 'John',
			options: [
				'John',
			],
		});
		const icon = wrapper.find('.icon');

		expect(icon.attributes('data-icon')).toBe('ws-chat');
		expect(icon.attributes('data-color')).toBe(IconColor.CHAT);
		expect(wrapper.find('.communication-cell-list__value').text()).toBe('John');
	});

	it('shows the icon alone without a value', () => {
		const wrapper = mountList({});

		expect(wrapper.find('.icon').exists()).toBe(true);
		expect(wrapper.find('.communication-cell-list__value').exists()).toBe(
			false,
		);
		expect(menuOf(wrapper).exists()).toBe(false);
	});

	it('lets the cell replace the icon', () => {
		const wrapper = mountList(
			{
				value: '111',
			},
			{
				icon: '<button class="own-icon" />',
			},
		);

		expect(wrapper.find('.own-icon').exists()).toBe(true);
	});

	it('shows no counter for a single value', () => {
		expect(
			menuOf(
				mountList({
					value: 'John',
					options: [
						'John',
					],
				}),
			).exists(),
		).toBe(false);
	});

	it('counts the values besides the shown one, with the cell tooltip', () => {
		const wrapper = mountList(
			{
				value: 'John',
				options: [
					'John',
					'Jane',
					'Jim',
				],
			},
			{
				'more-tooltip': ({ count }: { count: number }) => `${count} more`,
			},
		);

		expect(wrapper.find('.more-chip').text()).toBe('+2');
		expect(wrapper.find('.tooltip-text').text()).toBe('2 more');
	});

	it('lists every value in the menu, each with the column icon', () => {
		const wrapper = mountList({
			value: 'John',
			options: [
				'John',
				'Jane',
			],
		});

		expect(menuOf(wrapper).props('options')).toEqual([
			{
				text: 'John',
			},
			{
				text: 'Jane',
			},
		]);
		expect(wrapper.find('.communication-cell-list__option').text()).toBe(
			'John',
		);
	});

	it('passes the disabled state to the menu', () => {
		const wrapper = mountList({
			value: 'John',
			options: [
				'John',
				'Jane',
			],
			disabled: true,
		});

		expect(menuOf(wrapper).props('disabled')).toBe(true);
	});

	it('emits the value of the chosen menu row', () => {
		const wrapper = mountList({
			value: 'John',
			options: [
				'John',
				'Jane',
			],
		});

		menuOf(wrapper).vm.$emit('click', {
			option: {
				text: 'Jane',
			},
		});

		expect(wrapper.emitted('select')).toEqual([
			[
				'Jane',
			],
		]);
	});
});
