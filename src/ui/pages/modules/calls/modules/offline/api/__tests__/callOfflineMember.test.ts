import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowRef } from 'vue';

const directMember = vi.fn();
const agent = shallowRef<{
	directMember: typeof directMember;
} | null>(null);

vi.mock(
	'../../../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			agent,
		}),
	}),
);

import { callOfflineMember } from '../callOfflineMember';

describe('callOfflineMember', () => {
	beforeEach(() => {
		directMember.mockReset();
		directMember.mockResolvedValue({});
		agent.value = {
			directMember,
		};
	});

	it('asks the queue to call the member on the communication', async () => {
		await callOfflineMember(1, 2);

		expect(directMember).toHaveBeenCalledWith(1, 2);
	});

	it('throws a refused request to the caller', async () => {
		const error = new Error('refused');
		directMember.mockRejectedValue(error);

		await expect(callOfflineMember(1, 2)).rejects.toBe(error);
	});

	it('does nothing without an agent session', async () => {
		agent.value = null;

		await callOfflineMember(1, 2);

		expect(directMember).not.toHaveBeenCalled();
	});
});
