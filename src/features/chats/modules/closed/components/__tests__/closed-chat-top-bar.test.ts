import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import type { ILeftThread } from '../../../../types/ChatSession.types';
import ClosedChatTopBar from '../closed-chat-top-bar.vue';

const thread = {
	id: 'thread-1',
	members: [
		{
			id: 'member-1',
			contact: {
				sub: 'agent-sub',
				iss: 'webitel',
				username: 'agent',
			},
		},
		{
			id: 'member-2',
			contact: {
				sub: 'client-sub',
				iss: 'telegram',
				username: 'client_username',
				name: 'Client Name',
			},
		},
	],
} as unknown as ILeftThread;

const mountBar = (overrides: Partial<ILeftThread> = {}) => {
	const wrapper = mount(ClosedChatTopBar, {
		props: {
			thread: {
				...thread,
				...overrides,
			} as ILeftThread,
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs: {
				'wt-icon': {
					props: [
						'icon',
					],
					template: '<i class="icon" :data-icon="icon" />',
				},
				'wt-avatar': {
					props: [
						'username',
					],
					template: '<i class="avatar">{{ username }}</i>',
				},
			},
		},
	});
	return wrapper;
};

describe('closed-chat-top-bar', () => {
	it('shows a lock and the client, told from the agents', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.icon').attributes('data-icon')).toBe('lock');
		expect(wrapper.find('.avatar').text()).toBe('client_username');
		expect(wrapper.text()).toContain('client_username');
	});

	it('shows the queue the agent received the chat through', () => {
		const wrapper = mountBar({
			queue: {
				id: '12',
				name: 'Sales',
			},
		});

		expect(wrapper.find('.task-top-bar__subtitle-value').text()).toBe('Sales');
	});

	it('has no queue when the backend does not know it', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.task-top-bar__subtitle').exists()).toBe(false);
	});

	it('has no status and no actions', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.task-top-bar__trailing').text()).toBe('');
		expect(wrapper.find('button').exists()).toBe(false);
	});
});
