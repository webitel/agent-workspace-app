import { mount } from '@vue/test-utils';
import { WtAvatar } from '@webitel/ui-sdk/components';
import { describe, expect, it } from 'vitest';

import ClientIdentityBlock from '../client-identity-block.vue';

const mountBlock = (props: Record<string, unknown> = {}) =>
	mount(ClientIdentityBlock, {
		props: {
			size: 'sm',
			name: 'John Smith',
			...props,
		},
	});

describe('client-identity-block', () => {
	it('falls back to "unknown contact" when identification found no name', () => {
		const wrapper = mountBlock({
			name: undefined,
		});

		expect(wrapper.text()).toContain('ui.clientIdentity.unknownContact');
	});

	it.each([
		'sm',
		'lg',
	])('passes the %s size through to the avatar and the layout', (size) => {
		const wrapper = mountBlock({
			size,
		});

		expect(wrapper.findComponent(WtAvatar).props('size')).toBe(size);
		expect(wrapper.classes()).toContain(`client-identity-block--${size}`);
	});

	/**
	 * The chip counts the contacts *beyond* the one named, so nothing to show is
	 * the same as exactly one match — and the count is absent entirely until the
	 * backend supplies it (WS-16).
	 */
	it.each([
		[
			undefined,
			false,
		],
		[
			0,
			false,
		],
		[
			3,
			true,
		],
	])('shows the +N chip only for a remainder: %s', (additionalContacts, shown) => {
		const wrapper = mountBlock({
			additionalContacts,
		});

		const chip = wrapper.find('.wt-chip');
		expect(chip.exists()).toBe(shown);
		if (shown) expect(chip.text()).toContain('+3');
	});

	it('omits the identifier when the channel has none', () => {
		expect(
			mountBlock().find('.client-identity-block__identifier').exists(),
		).toBe(false);
	});

	it('shows the identifier when there is one', () => {
		const wrapper = mountBlock({
			identifier: '@john',
		});

		expect(wrapper.find('.client-identity-block__identifier').text()).toBe(
			'@john',
		);
	});

	it('names the channel beside the contact when there is one', () => {
		const wrapper = mountBlock({
			channel: {
				label: 'Channel',
				value: 'Telegram',
			},
		});

		const line = wrapper.find('.client-identity-block__channel');
		expect(line.text()).toContain('Channel:');
		expect(line.text()).toContain('Telegram');
		expect(line.attributes('title')).toBe('Telegram');
	});

	it('renders no channel line when there is no channel', () => {
		expect(mountBlock().find('.client-identity-block__channel').exists()).toBe(
			false,
		);
	});

	it('draws the channel icon only when one is given', () => {
		const withIcon = mountBlock({
			channel: {
				label: 'Channel',
				value: 'Telegram',
				icon: 'chat',
			},
		});
		const withoutIcon = mountBlock({
			channel: {
				label: 'Channel',
				value: 'Telegram',
			},
		});

		expect(
			withIcon.find('.client-identity-block__channel .wt-icon').exists(),
		).toBe(true);
		expect(
			withoutIcon.find('.client-identity-block__channel .wt-icon').exists(),
		).toBe(false);
	});

	it('lays out a slot for the interaction timer ring around the avatar', () => {
		const wrapper = mount(ClientIdentityBlock, {
			props: {
				size: 'sm',
				name: 'John Smith',
			},
			slots: {
				ring: '<i class="ring" />',
			},
		});

		expect(wrapper.find('.client-identity-block__avatar .ring').exists()).toBe(
			true,
		);
	});
});
