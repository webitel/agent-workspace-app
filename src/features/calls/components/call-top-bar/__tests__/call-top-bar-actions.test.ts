import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import type { Call } from 'webitel-sdk';

const toggleMuteMock = vi.fn();
const toggleHoldMock = vi.fn();
const hangupMock = vi.fn();

vi.mock('../../../store/calls', () => ({
	useCallsStore: () => ({
		toggleMute: (...args: unknown[]) => toggleMuteMock(...args),
		toggleHold: (...args: unknown[]) => toggleHoldMock(...args),
		hangup: (...args: unknown[]) => hangupMock(...args),
	}),
}));

const openTransferMock = vi.fn();

vi.mock(
	'../../../../../ui/call/modules/call-transfer/store/callTransferPopup',
	() => ({
		useCallTransferPopupStore: () => ({
			open: (...args: unknown[]) => openTransferMock(...args),
		}),
	}),
);

import CallTopBarActions from '../call-top-bar-actions.vue';

const buildCall = (overrides: Record<string, unknown> = {}): Call =>
	reactive({
		id: 'call-1',
		muted: false,
		isHold: false,
		answeredAt: 1_700_000_000_000,
		hangupAt: 0,
		allowTransfer: true,
		...overrides,
	}) as unknown as Call;

const mountActions = (call: Call = buildCall()) =>
	mount(CallTopBarActions, {
		props: {
			call,
		},
		global: {
			stubs: {
				'wt-button': {
					props: [
						'icon',
						'disabled',
					],
					template:
						'<button class="button" :data-icon="icon" :disabled="disabled"><slot /></button>',
				},
				'wt-divider': true,
			},
		},
	});

const findAction = (wrapper: ReturnType<typeof mountActions>, name: string) =>
	wrapper.find(`[aria-label="ui.call.activeCall.actions.${name}"]`);

describe('call-top-bar-actions', () => {
	beforeEach(() => {
		toggleMuteMock.mockClear();
		toggleHoldMock.mockClear();
		hangupMock.mockClear();
		openTransferMock.mockClear();
	});

	it('opens the transfer popup for this call (AC_13.01.08)', async () => {
		await findAction(mountActions(), 'transfer').trigger('click');

		expect(openTransferMock).toHaveBeenCalledWith('call-1');
	});

	it('disables transfer when the call cannot be transferred', () => {
		const wrapper = mountActions(
			buildCall({
				allowTransfer: false,
			}),
		);

		expect(
			findAction(wrapper, 'transfer').attributes('disabled'),
		).toBeDefined();
	});

	it('holds a place for the actions not built yet, disabled (AC_13.01.03, .05, .07)', () => {
		const wrapper = mountActions();

		for (const name of [
			'numpad',
			'camera',
			'message',
		]) {
			expect(findAction(wrapper, name).attributes('disabled')).toBeDefined();
		}
	});

	it('toggles the microphone of this call (AC_13.01.04)', async () => {
		await findAction(mountActions(), 'mute').trigger('click');

		expect(toggleMuteMock).toHaveBeenCalledWith('call-1');
	});

	it('crosses the microphone out while muted, and says it is pressed', () => {
		const live = findAction(mountActions(), 'mute');
		const muted = findAction(
			mountActions(
				buildCall({
					muted: true,
				}),
			),
			'mute',
		);

		expect(live.attributes('data-icon')).toBe('mic');
		expect(live.attributes('aria-pressed')).toBe('false');
		expect(muted.attributes('data-icon')).toBe('mic-muted');
		expect(muted.attributes('aria-pressed')).toBe('true');
	});

	it('puts this call on hold and takes it off (AC_13.01.06)', async () => {
		await findAction(mountActions(), 'hold').trigger('click');

		expect(toggleHoldMock).toHaveBeenCalledWith('call-1');
	});

	it('says hold is pressed while the call is held', () => {
		const live = findAction(mountActions(), 'hold');
		const held = findAction(
			mountActions(
				buildCall({
					isHold: true,
				}),
			),
			'hold',
		);

		expect(live.attributes('aria-pressed')).toBe('false');
		expect(held.attributes('aria-pressed')).toBe('true');
	});

	it('ends this call (AC_13.01.09)', async () => {
		await findAction(mountActions(), 'hangup').trigger('click');

		expect(hangupMock).toHaveBeenCalledWith('call-1');
	});
});
