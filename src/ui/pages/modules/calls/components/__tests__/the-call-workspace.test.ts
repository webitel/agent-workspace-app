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
vi.mock('vue-router', () => ({
	useRoute: () => route,
	useRouter: () => ({
		replace: (...args: unknown[]) => routerReplaceMock(...args),
	}),
}));

const callsById = reactive<
	Record<
		string,
		{
			id: string;
		}
	>
>({});
vi.mock('../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: (id: string) => callsById[id],
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
		route.params.callId = 'call-1';
		for (const key of Object.keys(callsById)) delete callsById[key];
	});

	it('redirects to the calls page when the SDK does not keep the call', () => {
		mountWorkspace();

		expect(routerReplaceMock).toHaveBeenCalledWith('/calls');
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
});
