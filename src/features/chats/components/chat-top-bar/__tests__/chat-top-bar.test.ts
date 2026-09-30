import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

const NOW = 1_000_000;

const endChatMock = vi.fn();
let selfMember:
	| {
			id: string;
	  }
	| undefined = {
	id: 'agent-member',
};

vi.mock('../../../store/chats', () => ({
	useChatsStore: () => ({
		getSelfMember: () => selfMember,
		endChat: (...args: unknown[]) => endChatMock(...args),
	}),
}));

const emitMock = vi.fn();
vi.mock('@webitel/ui-sdk/scripts', async (importOriginal) => ({
	...(await importOriginal<object>()),
	eventBus: {
		$emit: (...args: unknown[]) => emitMock(...args),
	},
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (
			key: string,
			params?: {
				count?: number;
			},
		) => (params ? `${key}:${params.count}` : key),
	}),
}));

import ChatTopBar from '../chat-top-bar.vue';

let nextId = 1;

function makeTask(overrides = {}) {
	return reactive({
		id: nextId++,
		state: 'bridged',
		displayNumber: 'client_username',
		displayName: 'Client Name',
		queue: {
			id: 1,
			name: 'Support',
		},
		hasForm: false,
		form: null,
		processingSec: null,
		processingTimeoutAt: null,
		renewalSec: null,
		_processing: null,
		renew: vi.fn(() => Promise.resolve({})),
		...overrides,
	});
}

const postProcessing = (overrides = {}) =>
	makeTask({
		state: 'processing',
		processingSec: 100,
		processingTimeoutAt: NOW + 100_000,
		renewalSec: 10,
		_processing: {
			processing_prolongation: {
				remaining_prolongations: 2,
				prolongation_sec: 30,
			},
		},
		...overrides,
	});

const stubs = {
	'wt-icon': true,
	'wt-avatar': {
		props: [
			'username',
		],
		template: '<i class="avatar">{{ username }}</i>',
	},
	'wt-tooltip': {
		template: '<div><slot name="activator" /><slot /></div>',
	},
	'wt-icon-btn': {
		props: [
			'disabled',
			'icon',
		],
		template: '<button class="icon-btn" :class="icon" :disabled="disabled" />',
	},
	'wt-button': {
		props: [
			'disabled',
			'loading',
		],
		template:
			'<button class="button" :disabled="disabled" :data-loading="loading" />',
	},
	'wt-confirm-dialog': {
		props: [
			'callback',
		],
		template:
			'<div class="confirm"><button class="confirm-yes" @click="callback" /></div>',
	},
};

const mountBar = (task: ReturnType<typeof makeTask>) =>
	mount(ChatTopBar, {
		props: {
			task: task as never,
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

describe('chat-top-bar', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		endChatMock.mockReset();
		emitMock.mockClear();
		selfMember = {
			id: 'agent-member',
		};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows who the chat is with and the queue it came from', () => {
		const wrapper = mountBar(makeTask());

		expect(wrapper.find('.avatar').text()).toBe('client_username');
		expect(wrapper.text()).toContain('client_username');
		expect(wrapper.text()).toContain('Support');
	});

	it('offers to end a live chat and no timer', () => {
		const wrapper = mountBar(makeTask());

		expect(wrapper.find('.button').exists()).toBe(true);
		expect(wrapper.find('.chat-top-bar-timer').exists()).toBe(false);
	});

	it('keeps transfer in place but disabled', () => {
		const wrapper = mountBar(makeTask());

		const transfer = wrapper.find('.icon-btn.chat-transfer--filled');
		expect(transfer.exists()).toBe(true);
		expect(transfer.attributes('disabled')).toBeDefined();
	});

	it('disables ending when the agent’s own membership is unknown', () => {
		selfMember = undefined;

		const wrapper = mountBar(makeTask());

		expect(wrapper.find('.button').attributes('disabled')).toBeDefined();
	});

	it('ends the chat after confirmation', async () => {
		const task = makeTask();
		endChatMock.mockResolvedValue(undefined);
		const wrapper = mountBar(task);

		expect(wrapper.find('.confirm').exists()).toBe(false);
		await wrapper.find('.button').trigger('click');
		await wrapper.find('.confirm-yes').trigger('click');
		await flushPromises();

		expect(endChatMock).toHaveBeenCalledWith(task);
	});

	it('reports a failed end and lets the agent try again', async () => {
		endChatMock.mockRejectedValue(new Error('offline'));
		const wrapper = mountBar(makeTask());

		await wrapper.find('.button').trigger('click');
		await wrapper.find('.confirm-yes').trigger('click');
		await flushPromises();

		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'offline',
		});
		expect(wrapper.find('.button').attributes('data-loading')).not.toBe('true');
	});

	it('swaps ending for the countdown once the chat is in post-processing', async () => {
		const task = makeTask();
		const wrapper = mountBar(task);

		task.state = 'processing';
		task.processingSec = 100;
		task.processingTimeoutAt = NOW + 59_000;
		await nextTick();

		expect(wrapper.find('.chat-top-bar-timer').text()).toContain('00:59');
		expect(wrapper.find('.button').exists()).toBe(false);
	});

	it('turns the countdown from green to orange to red as it runs down', async () => {
		const task = postProcessing();
		const wrapper = mountBar(task);
		const time = () => wrapper.find('.chat-top-bar-timer__time');

		expect(time().classes()).toContain('chat-top-bar-timer__time--success');

		vi.setSystemTime(NOW + 50_000);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(time().classes()).toContain('chat-top-bar-timer__time--warning');

		vi.setSystemTime(NOW + 80_000);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(time().classes()).toContain('chat-top-bar-timer__time--error');
	});

	it('opens renewal only in the queue’s renewal window, with the extensions left in the tooltip', async () => {
		const task = postProcessing();
		const wrapper = mountBar(task);
		const renew = () => wrapper.find('.icon-btn.plus');

		expect(renew().attributes('disabled')).toBeDefined();
		expect(wrapper.text()).toContain('ui.pages.chats.topBar.extensionsLeft:2');

		vi.setSystemTime(NOW + 95_000);
		await vi.advanceTimersByTimeAsync(1_000);
		expect(renew().attributes('disabled')).toBeUndefined();

		await renew().trigger('click');
		expect(task.renew).toHaveBeenCalledWith(30);
	});
});
