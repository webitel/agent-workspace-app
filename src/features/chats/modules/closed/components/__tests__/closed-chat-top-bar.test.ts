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
				username: 'agent',
			},
		},
		{
			id: 'member-2',
			contact: {
				sub: 'client-sub',
				username: 'client_username',
				name: 'Client Name',
			},
		},
	],
} as unknown as ILeftThread;

const mountBar = () => {
	const wrapper = mount(ClosedChatTopBar, {
		props: {
			thread,
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					initialState: {
						userinfo: {
							userId: 'agent-sub',
						},
					},
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
	it('shows a lock and the client, told from the current user', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.icon').attributes('data-icon')).toBe('lock');
		expect(wrapper.find('.avatar').text()).toBe('client_username');
		expect(wrapper.text()).toContain('client_username');
	});

	it('has no queue, no status and no actions', () => {
		const wrapper = mountBar();

		expect(wrapper.find('.task-top-bar__subtitle').exists()).toBe(false);
		expect(wrapper.find('.task-top-bar__trailing').text()).toBe('');
		expect(wrapper.find('button').exists()).toBe(false);
	});
});
