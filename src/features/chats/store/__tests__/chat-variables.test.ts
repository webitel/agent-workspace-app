import { createTestingPinia } from '@pinia/testing';
import { getActivePinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const locateVariablesMock = vi.fn();

vi.mock('../../api/chatSdk', () => ({
	threadsService: {
		locateVariables: (...args: unknown[]) => locateVariablesMock(...args),
	},
	messagesService: {},
}));

import { disposeChatVariables, useChatVariablesStore } from '../chat-variables';

describe('chat-variables store', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
				createSpy: vi.fn,
			}),
		);
		locateVariablesMock.mockReset();
	});

	describe('refresh', () => {
		it('stores the thread variables it fetched', async () => {
			locateVariablesMock.mockResolvedValue({
				variables: {
					Region: {
						value: 'EU',
					},
				},
			});
			const store = useChatVariablesStore('chat-1');

			await store.refresh();

			expect(locateVariablesMock).toHaveBeenCalledWith('chat-1');
			expect(store.variables).toEqual({
				Region: {
					value: 'EU',
				},
			});
		});

		it('keeps the last good variables and reports the error when a refresh fails', async () => {
			locateVariablesMock.mockResolvedValueOnce({
				variables: {
					Region: {
						value: 'EU',
					},
				},
			});
			const store = useChatVariablesStore('chat-1');
			await store.refresh();

			const failure = new Error('network down');
			locateVariablesMock.mockRejectedValueOnce(failure);
			await store.refresh();

			expect(store.variables).toEqual({
				Region: {
					value: 'EU',
				},
			});
			expect(store.error).toBe(failure);
		});

		it('clears a previous error once a refresh succeeds', async () => {
			locateVariablesMock.mockRejectedValueOnce(new Error('network down'));
			const store = useChatVariablesStore('chat-1');
			await store.refresh();
			expect(store.error).not.toBeNull();

			locateVariablesMock.mockResolvedValueOnce({
				variables: {},
			});
			await store.refresh();

			expect(store.error).toBeNull();
		});

		const httpError = (status: number) =>
			Object.assign(new Error(`HTTP ${status}`), {
				response: {
					status,
				},
			});

		it('treats a 404 as a thread without variables, not as an error', async () => {
			locateVariablesMock.mockRejectedValueOnce(httpError(404));
			const store = useChatVariablesStore('chat-1');

			await store.refresh();

			expect(store.variables).toEqual({});
			expect(store.error).toBeNull();
		});

		it('degrades a 403 to no thread variables, logging it instead of raising an error', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			locateVariablesMock.mockRejectedValueOnce(httpError(403));
			const store = useChatVariablesStore('chat-1');

			await store.refresh();

			expect(store.variables).toEqual({});
			expect(store.error).toBeNull();
			expect(warn).toHaveBeenCalled();
			warn.mockRestore();
		});

		it('drops variables that vanished when the thread now answers 404', async () => {
			locateVariablesMock.mockResolvedValueOnce({
				variables: {
					Region: {
						value: 'EU',
					},
				},
			});
			const store = useChatVariablesStore('chat-1');
			await store.refresh();

			locateVariablesMock.mockRejectedValueOnce(httpError(404));
			await store.refresh();

			expect(store.variables).toEqual({});
		});

		it('flags the request as loading, and the first answer as having arrived', async () => {
			let answer: (value: unknown) => void = () => {};
			locateVariablesMock.mockReturnValueOnce(
				new Promise((resolve) => {
					answer = resolve;
				}),
			);
			const store = useChatVariablesStore('chat-1');
			expect(store.isLoaded).toBe(false);

			const pending = store.refresh();
			expect(store.isLoading).toBe(true);

			answer({
				variables: {},
			});
			await pending;

			expect(store.isLoading).toBe(false);
			expect(store.isLoaded).toBe(true);
		});

		it('counts a failed first request as an answer, so the tab shows the error, not a loader', async () => {
			locateVariablesMock.mockRejectedValueOnce(new Error('network down'));
			const store = useChatVariablesStore('chat-1');

			await store.refresh();

			expect(store.isLoaded).toBe(true);
		});

		it('keeps the newest answer when an older request settles last', async () => {
			const answers: Array<(value: unknown) => void> = [];
			locateVariablesMock.mockImplementation(
				() =>
					new Promise((resolve) => {
						answers.push(resolve);
					}),
			);
			const store = useChatVariablesStore('chat-1');

			const older = store.refresh();
			const newer = store.refresh();
			answers[1]({
				variables: {
					Region: {
						value: 'new',
					},
				},
			});
			await newer;
			answers[0]({
				variables: {
					Region: {
						value: 'old',
					},
				},
			});
			await older;

			expect(store.variables).toEqual({
				Region: {
					value: 'new',
				},
			});
			expect(store.isLoading).toBe(false);
		});
	});

	describe('disposeChatVariables', () => {
		it("drops the chat's state, so a reopened chat starts from nothing", async () => {
			locateVariablesMock.mockResolvedValue({
				variables: {
					Region: {
						value: 'EU',
					},
				},
			});
			const first = useChatVariablesStore('chat-1');
			await first.refresh();
			expect(
				getActivePinia()?.state.value['chat-variables:chat-1'],
			).toBeDefined();

			disposeChatVariables('chat-1');

			expect(
				getActivePinia()?.state.value['chat-variables:chat-1'],
			).toBeUndefined();
			const reopened = useChatVariablesStore('chat-1');
			expect(reopened.isLoaded).toBe(false);
			expect(reopened.variables).toEqual({});
		});

		it('does nothing for a chat that never read its variables', () => {
			expect(() => disposeChatVariables('never-opened')).not.toThrow();
			expect(
				getActivePinia()?.state.value['chat-variables:never-opened'],
			).toBeUndefined();
		});
	});
});
