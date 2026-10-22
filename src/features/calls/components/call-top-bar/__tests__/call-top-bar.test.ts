import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import type { Call } from 'webitel-sdk';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

// the shared i18n instance can't be constructed under the global vue-i18n mock
// the calls store takes the agent to a call's window; the app's routes would
// pull every page in
vi.mock('../../../../../app/router', () => ({
	router: null,
}));

vi.mock('../../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

import CallTopBar from '../call-top-bar.vue';

let nextTaskId = 1;

const makeTask = (overrides: Record<string, unknown> = {}) =>
	reactive({
		id: nextTaskId++,
		state: 'bridged',
		hasForm: false,
		form: null,
		...overrides,
	});

const buildCall = (overrides: Record<string, unknown> = {}): Call =>
	reactive({
		id: 'call-1',
		displayName: 'Emily Johnson',
		displayNumber: '+12023417842',
		hideContact: false,
		hideNumber: false,
		queue: {
			queue_name: 'Sales',
		},
		answeredAt: 1,
		hangupAt: 0,
		isHold: false,
		muted: false,
		task: null,
		...overrides,
	}) as unknown as Call;

const stubs = {
	'wt-icon': true,
	'wt-copy-action': {
		props: [
			'value',
		],
		template: '<button class="copy-action" :data-value="value" />',
	},
	CallTopBarActions: {
		props: [
			'call',
		],
		template: '<div class="actions-stub" />',
	},
	PostProcessingTimer: {
		props: [
			'task',
		],
		template: '<div class="timer-stub" />',
	},
};

const mountBar = (call: Call) =>
	mount(CallTopBar, {
		props: {
			call,
		},
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

describe('call-top-bar', () => {
	it('leads with the number and names the queue (AC_13.01.01)', () => {
		const text = mountBar(buildCall()).text();

		expect(text).toContain('+12023417842');
		expect(text).toContain('ui.notifications.offer.queue');
		expect(text).toContain('Sales');
	});

	it('leads with the number even when the contact is identified', () => {
		expect(mountBar(buildCall()).text()).not.toContain('Emily Johnson');
	});

	it('names an unknown caller when there is no number', () => {
		const text = mountBar(
			buildCall({
				displayNumber: '',
			}),
		).text();

		expect(text).toContain('ui.notifications.offer.unknownContact');
		expect(text).not.toContain('Emily Johnson');
	});

	it('masks the number when the platform hides it', () => {
		expect(
			mountBar(
				buildCall({
					hideNumber: true,
				}),
			).text(),
		).toContain('*****842');
	});

	it('copies the number (AC_13.01.02)', () => {
		expect(
			mountBar(buildCall()).find('.copy-action').attributes('data-value'),
		).toBe('+12023417842');
	});

	it('offers no copy when the number is hidden or absent', () => {
		const hidden = mountBar(
			buildCall({
				hideNumber: true,
			}),
		);
		const absent = mountBar(
			buildCall({
				displayNumber: '',
			}),
		);

		expect(hidden.find('.copy-action').exists()).toBe(false);
		expect(absent.find('.copy-action').exists()).toBe(false);
	});

	it('offers the call actions while connected, without a timer', () => {
		const bar = mountBar(buildCall());

		expect(bar.find('.actions-stub').exists()).toBe(true);
		expect(bar.find('.timer-stub').exists()).toBe(false);
	});

	it('keeps the call actions when a form lands mid-call', () => {
		const bar = mountBar(
			buildCall({
				task: makeTask({
					state: 'bridged',
					hasForm: true,
				}),
			}),
		);

		expect(bar.find('.actions-stub').exists()).toBe(true);
		expect(bar.find('.timer-stub').exists()).toBe(false);
	});

	it('swaps the actions for the post-processing timer once hung up (AC_13.01.10)', () => {
		const bar = mountBar(
			buildCall({
				hangupAt: 2,
				task: makeTask({
					state: 'processing',
				}),
			}),
		);

		expect(bar.find('.actions-stub').exists()).toBe(false);
		expect(bar.find('.timer-stub').exists()).toBe(true);
	});

	it('shows neither once hung up with no post-processing to time', () => {
		const bar = mountBar(
			buildCall({
				hangupAt: 2,
			}),
		);

		expect(bar.find('.actions-stub').exists()).toBe(false);
		expect(bar.find('.timer-stub').exists()).toBe(false);
	});
});
