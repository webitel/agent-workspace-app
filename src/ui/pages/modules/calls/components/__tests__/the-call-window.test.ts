import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';

const route = reactive({
	params: {
		callId: 'call-1',
	},
});

vi.mock('vue-router', () => ({
	useRoute: () => route,
}));

type FakeCall = ReturnType<typeof makeCall>;
const callsById = reactive<Record<string, FakeCall>>({});

// The real calls store pulls the socket client and offers in; the window only
// needs the id -> call lookup.
vi.mock('../../../../../../features/calls/store/calls', () => ({
	useCallsStore: () => ({
		getCallById: (id: string) => callsById[id],
	}),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtDivider: {
		name: 'WtDivider',
		template: '<hr />',
	},
	WtTabs: {
		name: 'WtTabs',
		props: [
			'current',
			'tabs',
		],
		emits: [
			'change',
		],
		template: '<nav class="wt-tabs-stub" />',
	},
}));

vi.mock(
	'../../../../../../features/processing/components/the-processing-form.vue',
	() => ({
		default: {
			name: 'TheProcessingForm',
			props: [
				'task',
			],
			template: '<div class="processing-form-stub" />',
		},
	}),
);

vi.mock(
	'../../../../../../features/calls/components/call-info/call-info.vue',
	() => ({
		default: {
			name: 'CallInfo',
			props: [
				'call',
			],
			template: '<div class="info-stub" />',
		},
	}),
);

vi.mock(
	'../../../../../../features/calls/components/call-top-bar/call-top-bar.vue',
	() => ({
		default: {
			name: 'CallTopBar',
			props: [
				'call',
			],
			template: '<div class="top-bar-stub" />',
		},
	}),
);

import TheCallWindow from '../the-call-window.vue';

let nextId = 1;

const makeForm = () => ({
	metadata: {
		isInited: true,
	},
	actions: [],
	body: [],
});

function makeTask({ withForm = false, state = 'bridged' } = {}) {
	return reactive({
		id: nextId++,
		hasForm: withForm,
		state,
		form: withForm ? makeForm() : null,
	});
}

function makeCall(id: string, task: ReturnType<typeof makeTask> | null) {
	return reactive({
		id,
		task,
	});
}

const mountWindow = () =>
	mount(TheCallWindow, {
		global: {
			plugins: [
				createTestingPinia({
					stubActions: false,
					createSpy: vi.fn,
				}),
			],
		},
	});

type StripTab = {
	value: string;
	text: string;
	disabled?: boolean;
};

const tabsOf = (wrapper: ReturnType<typeof mountWindow>) =>
	wrapper
		.findComponent({
			name: 'WtTabs',
		})
		.props('tabs') as StripTab[];

const tabValues = (wrapper: ReturnType<typeof mountWindow>) =>
	tabsOf(wrapper).map((tab) => tab.value);

const selectTab = async (
	wrapper: ReturnType<typeof mountWindow>,
	value: string,
) => {
	const tab = tabsOf(wrapper).find((candidate) => candidate.value === value);
	wrapper
		.findComponent({
			name: 'WtTabs',
		})
		.vm.$emit('change', tab);
	await nextTick();
};

const showsForm = (wrapper: ReturnType<typeof mountWindow>) =>
	wrapper.find('.processing-form-stub').exists();

describe('the-call-window', () => {
	beforeEach(() => {
		route.params.callId = 'call-1';
		for (const key of Object.keys(callsById)) delete callsById[key];
	});

	it('opens on Info, with no post-processing tab while there is no form', () => {
		const call = makeCall('call-1', makeTask());
		callsById['call-1'] = call;

		const wrapper = mountWindow();

		expect(tabValues(wrapper)).toEqual([
			'info',
			'interaction',
			'screenshots',
			'contact',
			'iframe',
		]);
		const info = wrapper.findComponent({
			name: 'CallInfo',
		});
		expect(info.exists()).toBe(true);
		expect(info.props('call')).toStrictEqual(call);
		expect(wrapper.find('.top-bar-stub').exists()).toBe(true);
	});

	it('labels the tabs from the locale', () => {
		callsById['call-1'] = makeCall(
			'call-1',
			makeTask({
				withForm: true,
			}),
		);

		const wrapper = mountWindow();

		expect(tabsOf(wrapper).map((tab) => tab.text)).toEqual([
			'ui.pages.calls.tabs.postProcessing',
			'ui.pages.calls.tabs.info',
			'ui.pages.calls.tabs.interaction',
			'ui.pages.calls.tabs.screenshots',
			'ui.pages.calls.tabs.contact',
			'ui.pages.calls.tabs.iframe',
		]);
	});

	it('shows Info alone for a call with no task', () => {
		callsById['call-1'] = makeCall('call-1', null);

		const wrapper = mountWindow();

		expect(tabValues(wrapper)).toEqual([
			'info',
			'interaction',
			'screenshots',
			'contact',
			'iframe',
		]);
		expect(wrapper.find('.info-stub').exists()).toBe(true);
	});

	it('renders nothing for a call the SDK no longer keeps', () => {
		const wrapper = mountWindow();

		expect(wrapper.find('.the-call-window').exists()).toBe(false);
	});

	it('marks the tabs whose content is not built yet as disabled, and ignores selecting them', async () => {
		callsById['call-1'] = makeCall('call-1', makeTask());
		const wrapper = mountWindow();

		expect(
			tabsOf(wrapper)
				.filter((tab) => tab.disabled)
				.map((tab) => tab.value),
		).toEqual([
			'interaction',
			'screenshots',
			'contact',
			'iframe',
		]);

		for (const value of [
			'interaction',
			'screenshots',
			'contact',
			'iframe',
		]) {
			await selectTab(wrapper, value);
			expect(wrapper.find('.info-stub').exists()).toBe(true);
		}
	});

	it('adds the post-processing tab when a form arrives mid-call, without switching to it', async () => {
		const task = makeTask();
		callsById['call-1'] = makeCall('call-1', task);
		const wrapper = mountWindow();

		task.hasForm = true;
		task.form = makeForm();
		await nextTick();

		expect(tabValues(wrapper)).toEqual([
			'processing',
			'info',
			'interaction',
			'screenshots',
			'contact',
			'iframe',
		]);
		expect(showsForm(wrapper)).toBe(false);

		await selectTab(wrapper, 'processing');
		expect(showsForm(wrapper)).toBe(true);
	});

	it('picks up a task the SDK attaches after the call', async () => {
		const call = makeCall('call-1', null);
		callsById['call-1'] = call;
		const wrapper = mountWindow();

		call.task = makeTask({
			withForm: true,
		});
		await nextTick();

		expect(tabValues(wrapper)).toContain('processing');
	});

	it('switches to the form when the call hangs up with one waiting', async () => {
		const task = makeTask({
			withForm: true,
		});
		callsById['call-1'] = makeCall('call-1', task);
		const wrapper = mountWindow();
		expect(showsForm(wrapper)).toBe(false);

		task.state = 'processing';
		await nextTick();

		expect(showsForm(wrapper)).toBe(true);
		expect(wrapper.find('.top-bar-stub').exists()).toBe(true);
	});

	it('opens a call already in post-processing on its form', async () => {
		callsById['call-1'] = makeCall('call-1', makeTask());
		callsById['call-2'] = makeCall(
			'call-2',
			makeTask({
				withForm: true,
				state: 'processing',
			}),
		);
		const wrapper = mountWindow();

		route.params.callId = 'call-2';
		await nextTick();

		expect(showsForm(wrapper)).toBe(true);
	});

	it('falls back to Info once the form is gone', async () => {
		const task = makeTask({
			withForm: true,
			state: 'processing',
		});
		callsById['call-1'] = makeCall('call-1', task);
		const wrapper = mountWindow();
		expect(showsForm(wrapper)).toBe(true);

		task.form = null;
		await nextTick();

		expect(showsForm(wrapper)).toBe(false);
		expect(wrapper.find('.info-stub').exists()).toBe(true);
		expect(tabValues(wrapper)).not.toContain('processing');
	});
});
