import { mount } from '@vue/test-utils';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import CallsHistoryNameCell from '../calls-history-name-cell.vue';

const stubs = {
	'wt-avatar': {
		props: [
			'src',
			'username',
		],
		template: '<i class="avatar" :data-src="src">{{ username }}</i>',
	},
	'wt-icon': {
		props: [
			'icon',
			'color',
		],
		template: '<i class="icon" :data-icon="icon" :data-color="color" />',
	},
};

const queue = {
	id: '335',
	name: 'Support queue',
};

const mountCell = (item: EngineHistoryCall) =>
	mount(CallsHistoryNameCell, {
		props: {
			item,
		},
		global: {
			stubs,
		},
	});

const getName = (item: EngineHistoryCall) => mountCell(item).find('p').text();

describe('calls-history-name-cell', () => {
	describe('outbound call name', () => {
		it('shows the callee name first', () => {
			expect(
				getName({
					direction: CallDirection.Outbound,
					to: {
						name: 'John',
						number: '380501112233',
					},
					destination: '0501112233',
				}),
			).toBe('John');
		});

		it('falls back to the callee number', () => {
			expect(
				getName({
					direction: CallDirection.Outbound,
					to: {
						number: '380501112233',
					},
					destination: '0501112233',
				}),
			).toBe('380501112233');
		});

		it('falls back to the dialed destination', () => {
			expect(
				getName({
					direction: CallDirection.Outbound,
					destination: '0501112233',
				}),
			).toBe('0501112233');
		});

		it('ignores the contact', () => {
			expect(
				getName({
					direction: CallDirection.Outbound,
					contact: {
						name: 'Contact',
					},
					destination: '0501112233',
				}),
			).toBe('0501112233');
		});
	});

	describe('inbound call name', () => {
		it('shows the contact name first', () => {
			expect(
				getName({
					direction: CallDirection.Inbound,
					contact: {
						name: 'Contact',
					},
					from: {
						name: 'Caller',
						number: '380501112233',
					},
				}),
			).toBe('Contact');
		});

		it('falls back to the caller name', () => {
			expect(
				getName({
					direction: CallDirection.Inbound,
					from: {
						name: 'Caller',
						number: '380501112233',
					},
				}),
			).toBe('Caller');
		});

		it('falls back to the caller number', () => {
			expect(
				getName({
					direction: CallDirection.Inbound,
					from: {
						number: '380501112233',
					},
				}),
			).toBe('380501112233');
		});
	});

	it('passes the shown name to the avatar', () => {
		const wrapper = mountCell({
			direction: CallDirection.Inbound,
			from: {
				name: 'Caller',
			},
		});

		expect(wrapper.find('.avatar').text()).toBe('Caller');
	});

	it.each([
		[
			'outbound',
			{
				direction: CallDirection.Outbound,
			},
			'ws-outbound-call',
			'info',
		],
		[
			'missed inbound',
			{
				direction: CallDirection.Inbound,
			},
			'ws-missed-call',
			'error',
		],
		[
			'answered inbound',
			{
				direction: CallDirection.Inbound,
				answeredAt: '1790947707140',
			},
			'ws-inbound-call',
			'success',
		],
	])('shows the %s call icon', (_, item, icon, color) => {
		const iconEl = mountCell(item).find('.icon');

		expect(iconEl.attributes('data-icon')).toBe(icon);
		expect(iconEl.attributes('data-color')).toBe(color);
	});

	it('shows the queue avatar for an unanswered outbound queue call', () => {
		const wrapper = mountCell({
			direction: CallDirection.Outbound,
			queue,
		});

		expect(wrapper.classes()).toContain('calls-history-name-cell--queue');
		expect(wrapper.find('.avatar').attributes('data-src')).toBeTruthy();
	});

	it('shows a regular avatar once the queue call is answered', () => {
		const wrapper = mountCell({
			direction: CallDirection.Outbound,
			queue,
			bridgedAt: '1790947707140',
		});

		expect(wrapper.classes()).not.toContain('calls-history-name-cell--queue');
		expect(wrapper.find('.avatar').attributes('data-src')).toBeUndefined();
	});
});
