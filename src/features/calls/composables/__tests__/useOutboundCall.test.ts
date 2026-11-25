import { beforeEach, describe, expect, it, vi } from 'vitest';

// the real store pulls in the socket client and the i18n singleton;
// the composable only needs `start`
const outboundCallAttemptsStore = {
	start: vi.fn(),
};

vi.mock('../../store/outboundCallAttempts', () => ({
	useOutboundCallAttemptsStore: () => outboundCallAttemptsStore,
}));

import { useOutboundCall } from '../useOutboundCall';

const pendingStart = () => {
	let finish: () => void = () => {};
	outboundCallAttemptsStore.start.mockReturnValue(
		new Promise<void>((resolve) => {
			finish = resolve;
		}),
	);
	return () => finish();
};

describe('useOutboundCall', () => {
	beforeEach(() => {
		outboundCallAttemptsStore.start.mockReset();
		outboundCallAttemptsStore.start.mockResolvedValue(undefined);
	});

	it('starts an outbound attempt on the number', async () => {
		const { call } = useOutboundCall();

		await call('380991358573');

		expect(outboundCallAttemptsStore.start).toHaveBeenCalledWith(
			'380991358573',
		);
	});

	it('does not dial without a number', async () => {
		const { call } = useOutboundCall();

		await call('');
		await call(undefined);

		expect(outboundCallAttemptsStore.start).not.toHaveBeenCalled();
	});

	it('is calling the number until the attempt settles', async () => {
		const { call, isCalling, callingNumber } = useOutboundCall();
		const finish = pendingStart();

		const calling = call('380991358573');
		expect(isCalling.value).toBe(true);
		expect(callingNumber.value).toBe('380991358573');

		finish();
		await calling;
		expect(isCalling.value).toBe(false);
		expect(callingNumber.value).toBeNull();
	});

	it('stops calling when the attempt fails', async () => {
		const { call, isCalling } = useOutboundCall();
		outboundCallAttemptsStore.start.mockRejectedValue(new Error('failed'));

		await expect(call('380991358573')).rejects.toThrow('failed');
		expect(isCalling.value).toBe(false);
	});

	it('ignores a second call while the first is starting', async () => {
		const { call } = useOutboundCall();
		const finish = pendingStart();

		const first = call('111');
		await call('222');
		finish();
		await first;

		expect(outboundCallAttemptsStore.start).toHaveBeenCalledTimes(1);
		expect(outboundCallAttemptsStore.start).toHaveBeenCalledWith('111');
	});
});
