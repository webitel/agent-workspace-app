import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

const NOW = 1_000_000;

const endChatMock = vi.fn();
vi.mock('../../../store/chats', () => ({
	useChatsStore: () => ({
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
		totalProcessingSec: null,
		processingTimeoutAt: null,
		renewalSec: null,
		_processing: null,
		renew: vi.fn(() => Promise.resolve({})),
		...overrides,
	});
}

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
			'icon',
		],
		template:
			'<button class="button" :class="icon" :disabled="disabled" :data-loading="loading" />',
	},
};

const endButton = (wrapper: ReturnType<typeof mountBar>) =>
	wrapper.find('.button.chat-end--filled');

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
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows who the chat is with and the queue it came from', () => {
		const wrapper = mountBar(makeTask());

		expect(wrapper.find('.avatar').text()).toBe('client_username');
		expect(wrapper.text()).toContain('client_username');
		expect(wrapper.text()).toContain('Support');
		expect(wrapper.text()).toContain('ui.notifications.offer.queue');
	});

	it('offers to end a live chat and no timer', () => {
		const wrapper = mountBar(makeTask());

		expect(endButton(wrapper).exists()).toBe(true);
		expect(wrapper.find('.post-processing-timer').exists()).toBe(false);
	});

	it('keeps transfer in place but disabled', () => {
		const wrapper = mountBar(makeTask());

		const transfer = wrapper.find('.button.chat-transfer--filled');
		expect(transfer.exists()).toBe(true);
		expect(transfer.attributes('disabled')).toBeDefined();
	});

	it('ends the chat on click, without asking first (AC_03.01.05)', async () => {
		const task = makeTask();
		endChatMock.mockResolvedValue(undefined);
		const wrapper = mountBar(task);

		await endButton(wrapper).trigger('click');
		await flushPromises();

		expect(endChatMock).toHaveBeenCalledWith(task);
	});

	it('reports a failed end and lets the agent try again', async () => {
		endChatMock.mockRejectedValue(new Error('offline'));
		const wrapper = mountBar(makeTask());

		await endButton(wrapper).trigger('click');
		await flushPromises();

		expect(emitMock).toHaveBeenCalledWith('notification', {
			type: 'error',
			text: 'offline',
		});
		expect(endButton(wrapper).attributes('data-loading')).not.toBe('true');
	});

	it('swaps ending for the countdown once the chat is in post-processing', async () => {
		const task = makeTask();
		const wrapper = mountBar(task);

		task.state = 'processing';
		task.totalProcessingSec = 100;
		task.processingTimeoutAt = NOW + 59_000;
		await nextTick();

		expect(wrapper.find('.post-processing-timer').text()).toContain('00:59');
		expect(endButton(wrapper).exists()).toBe(false);
	});
});
