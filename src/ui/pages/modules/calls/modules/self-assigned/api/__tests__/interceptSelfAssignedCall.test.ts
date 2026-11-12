import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowRef } from 'vue';

const interceptAttempt = vi.fn();
const agent = shallowRef<{
	interceptAttempt: typeof interceptAttempt;
} | null>(null);

vi.mock(
	'../../../../../../../../app/api/socket/composables/useWebSocketClient',
	() => ({
		useWebSocketClient: () => ({
			agent,
		}),
	}),
);

import { interceptSelfAssignedCall } from '../interceptSelfAssignedCall';

describe('interceptSelfAssignedCall', () => {
	beforeEach(() => {
		interceptAttempt.mockReset();
		interceptAttempt.mockResolvedValue({});
		agent.value = {
			interceptAttempt,
		};
	});

	it('intercepts the call attempt', async () => {
		await interceptSelfAssignedCall(7);

		expect(interceptAttempt).toHaveBeenCalledWith(7);
	});

	it('throws a refused intercept to the caller', async () => {
		const error = new Error('refused');
		interceptAttempt.mockRejectedValue(error);

		await expect(interceptSelfAssignedCall(7)).rejects.toBe(error);
	});

	it('does nothing without an agent session', async () => {
		agent.value = null;

		await interceptSelfAssignedCall(7);

		expect(interceptAttempt).not.toHaveBeenCalled();
	});
});
