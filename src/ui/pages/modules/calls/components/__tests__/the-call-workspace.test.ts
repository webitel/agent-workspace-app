import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

import TheCallWorkspace from '../the-call-workspace.vue';

const route = reactive({
	params: {
		callId: 'call-1',
	},
});
const routerReplaceMock = vi.fn();
let routeLeaveGuard: (() => void) | undefined;
let routeUpdateGuard: (() => void) | undefined;
vi.mock('vue-router', () => ({
	useRoute: () => route,
	useRouter: () => ({
		replace: (...args: unknown[]) => routerReplaceMock(...args),
	}),
	onBeforeRouteLeave: (guard: () => void) => {
		routeLeaveGuard = guard;
	},
	onBeforeRouteUpdate: (guard: () => void) => {
		routeUpdateGuard = guard;
	},
}));

const callsById = reactive<
	Record<
		string,
		{
			id: string;
		}
	>
>({});
const takeReturnTargetMock = vi.fn<(callId: string) => string | undefined>();
const forgetReturnTargetMock = vi.fn<(callId: string) => void>();
vi.mock('../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: (id: string) => callsById[id],
		takeReturnTarget: (callId: string) => takeReturnTargetMock(callId),
		forgetReturnTargetOfUnansweredCall: (callId: string) =>
			forgetReturnTargetMock(callId),
	}),
}));

vi.mock('../the-call-window.vue', () => ({
	default: {
		name: 'TheCallWindow',
		template: '<div />',
	},
}));

const mountWorkspace = () =>
	mount(TheCallWorkspace, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs: {
				'wt-layout': {
					template: '<section><slot /></section>',
				},
			},
		},
	});

describe('the-call-workspace', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		takeReturnTargetMock.mockReset();
		routeLeaveGuard = undefined;
		routeUpdateGuard = undefined;
		route.params.callId = 'call-1';
		for (const key of Object.keys(callsById)) delete callsById[key];
	});

	// a stale link, or a Return target that was itself a window since closed:
	// either way there is no window closing here, so no target is followed
	it('redirects to the calls page when the SDK does not keep the call', () => {
		takeReturnTargetMock.mockReturnValue('/chats/thread-1');

		mountWorkspace();

		expect(routerReplaceMock).toHaveBeenCalledWith('/calls');
		expect(takeReturnTargetMock).not.toHaveBeenCalled();
	});

	it('stays while the call is kept', () => {
		callsById['call-1'] = {
			id: 'call-1',
		};

		mountWorkspace();

		expect(routerReplaceMock).not.toHaveBeenCalled();
	});

	it('leaves once the call goes, its task released', async () => {
		callsById['call-1'] = {
			id: 'call-1',
		};
		mountWorkspace();

		delete callsById['call-1'];
		await nextTick();

		expect(routerReplaceMock).toHaveBeenCalledWith('/calls');
	});

	it("forgets the visit's target when the agent navigates away from the window (WS-105)", () => {
		callsById['call-1'] = {
			id: 'call-1',
		};
		mountWorkspace();

		routeLeaveGuard?.();

		expect(forgetReturnTargetMock).toHaveBeenCalledWith('call-1');
	});

	it('forgets the target when the window moves on to another call (WS-105)', () => {
		callsById['call-1'] = {
			id: 'call-1',
		};
		mountWorkspace();

		routeUpdateGuard?.();

		expect(forgetReturnTargetMock).toHaveBeenCalledWith('call-1');
	});

	it('gives way to where the agent was when they accepted the call (AC_13.01.13)', async () => {
		takeReturnTargetMock.mockReturnValue('/chats/thread-1');
		callsById['call-1'] = {
			id: 'call-1',
		};
		mountWorkspace();

		delete callsById['call-1'];
		await nextTick();

		expect(takeReturnTargetMock).toHaveBeenCalledWith('call-1');
		expect(routerReplaceMock).toHaveBeenCalledWith('/chats/thread-1');
	});
});
