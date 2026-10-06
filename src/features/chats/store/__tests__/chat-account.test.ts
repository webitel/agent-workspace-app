import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAccountMock = vi.fn();

vi.mock('../../api/chatSdk', () => ({
	accountService: {
		getAccount: (...args: unknown[]) => getAccountMock(...args),
	},
}));

import { useChatAccountStore } from '../chat-account';

const AGENT_ACCOUNT = {
	contact: {
		sub: '42',
		iss: 'webitel',
	},
};

describe('chat-account store', () => {
	beforeEach(() => {
		getAccountMock.mockReset();
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
	});

	it('is empty until it loads', () => {
		expect(useChatAccountStore().account).toBeNull();
	});

	it('loads the agent account', async () => {
		getAccountMock.mockResolvedValue(AGENT_ACCOUNT);
		const store = useChatAccountStore();

		const loaded = await store.load();

		expect(loaded).toEqual(AGENT_ACCOUNT);
		expect(store.account).toEqual(AGENT_ACCOUNT);
	});

	it('does not ask again once it has the account', async () => {
		getAccountMock.mockResolvedValue(AGENT_ACCOUNT);
		const store = useChatAccountStore();

		await store.load();
		await store.load();

		expect(getAccountMock).toHaveBeenCalledOnce();
	});

	// the chat list and a chat session can both ask in the same tick
	it('shares one request between callers that ask while it is in flight', async () => {
		getAccountMock.mockResolvedValue(AGENT_ACCOUNT);
		const store = useChatAccountStore();

		await Promise.all([
			store.load(),
			store.load(),
		]);

		expect(getAccountMock).toHaveBeenCalledOnce();
	});

	describe('when the request fails', () => {
		it('stays empty instead of throwing', async () => {
			getAccountMock.mockRejectedValue(new Error('boom'));
			const store = useChatAccountStore();

			await expect(store.load()).resolves.toBeNull();
			expect(store.account).toBeNull();
		});

		it('asks again on the next load', async () => {
			getAccountMock.mockRejectedValueOnce(new Error('boom'));
			getAccountMock.mockResolvedValue(AGENT_ACCOUNT);
			const store = useChatAccountStore();

			await store.load();
			await store.load();

			expect(getAccountMock).toHaveBeenCalledTimes(2);
			expect(store.account).toEqual(AGENT_ACCOUNT);
		});

		it('survives the service throwing before it returns a promise', async () => {
			getAccountMock.mockImplementationOnce(() => {
				throw new Error('not configured');
			});
			getAccountMock.mockResolvedValue(AGENT_ACCOUNT);
			const store = useChatAccountStore();

			await expect(store.load()).resolves.toBeNull();
			await store.load();

			expect(store.account).toEqual(AGENT_ACCOUNT);
		});
	});
});
