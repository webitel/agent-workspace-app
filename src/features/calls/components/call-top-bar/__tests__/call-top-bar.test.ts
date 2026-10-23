import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { Call } from 'webitel-sdk';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key,
	}),
}));

// the shared i18n instance can't be constructed under the global vue-i18n mock
vi.mock('../../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

vi.mock('../../../../../ui/task-top-bar/task-top-bar.vue', () => ({
	default: {
		name: 'TaskTopBar',
		props: [
			'name',
			'subtitle',
			'subtitleLabel',
		],
		template: '<header><slot name="leading" /></header>',
	},
}));

import CallTopBar from '../call-top-bar.vue';

const buildCall = (overrides: Partial<Call> = {}): Call =>
	({
		id: 'call-1',
		displayName: 'Emily Johnson',
		displayNumber: '+12023417842',
		hideContact: false,
		hideNumber: false,
		queue: {
			queue_name: 'Sales',
		},
		answeredAt: 1,
		isHold: false,
		muted: false,
		...overrides,
	}) as unknown as Call;

const barOf = (call: Call) =>
	mount(CallTopBar, {
		props: {
			call,
		},
		global: {
			stubs: {
				'wt-icon': true,
			},
		},
	}).findComponent({
		name: 'TaskTopBar',
	});

describe('call-top-bar', () => {
	it('leads with the number and names the queue (AC_13.01.01)', () => {
		const bar = barOf(buildCall());

		expect(bar.props('name')).toBe('+12023417842');
		expect(bar.props('subtitle')).toBe('Sales');
		expect(bar.props('subtitleLabel')).toBe('ui.notifications.offer.queue');
	});

	it('masks the number when the platform hides it', () => {
		const bar = barOf(
			buildCall({
				hideNumber: true,
			}),
		);

		expect(bar.props('name')).toBe('*****842');
	});
});
