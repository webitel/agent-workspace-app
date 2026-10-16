import { flushPromises, mount } from '@vue/test-utils';
import type { EngineHistoryCall } from '@webitel/api-services/gen/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CallInfoTab } from '../enums/CallInfoTab.enum';
import type { CallInfo } from '../types/CallInfo.types';

const getCallInfo = vi.fn();

vi.mock('../api/callInfoApi', () => ({
	getCallInfo: (id: string) => getCallInfo(id),
}));

import CallsHistoryInfoPopup from '../calls-history-info-popup.vue';

const tabStub = (name: string, props: string[]) => ({
	name,
	props,
	template: `<div class="tab" data-tab="${name}" />`,
});

const stubs = {
	'wt-popup': {
		emits: [
			'close',
		],
		template: `<div class="popup">
			<button class="popup-close" @click="$emit('close')" />
			<slot name="title" />
			<slot name="main" />
			<slot name="actions" />
		</div>`,
	},
	'wt-tabs': {
		name: 'WtTabs',
		props: [
			'current',
			'tabs',
		],
		emits: [
			'change',
		],
		template: '<div class="tabs" />',
	},
	'wt-loader': {
		template: '<div class="loader" />',
	},
	'wt-button': {
		emits: [
			'click',
		],
		template: '<button class="close-button" @click="$emit(\'click\')" />',
	},
	CallsHistoryInfoVariables: tabStub('CallsHistoryInfoVariables', [
		'variables',
	]),
	CallsHistoryInfoPostprocessing: tabStub('CallsHistoryInfoPostprocessing', [
		'forms',
		'agentDescription',
	]),
	CallsHistoryInfoTranscription: tabStub('CallsHistoryInfoTranscription', [
		'transcripts',
	]),
};

const callInfo: CallInfo = {
	id: 'parent',
	variables: {
		lang: 'uk',
	},
	agentDescription: 'callback later',
	forms: [
		{
			fields: [
				{
					key: 'status',
					value: 'done',
				},
			],
		},
	],
	transcripts: [
		{
			id: 't1',
		},
	],
};

const mountPopup = (
	item: EngineHistoryCall = {
		id: 'child',
		parentId: 'parent',
	},
) =>
	mount(CallsHistoryInfoPopup, {
		props: {
			item,
		},
		global: {
			stubs,
		},
	});

const tabsOf = (wrapper: ReturnType<typeof mountPopup>) =>
	wrapper.findComponent({
		name: 'WtTabs',
	});

const activeTabOf = (wrapper: ReturnType<typeof mountPopup>) =>
	wrapper.find('.tab');

const switchTab = (
	wrapper: ReturnType<typeof mountPopup>,
	value: CallInfoTab,
) =>
	tabsOf(wrapper).vm.$emit('change', {
		value,
	});

// lets the response arrive and the loader's minimum duration pass
const settle = async () => {
	await flushPromises();
	await vi.runAllTimersAsync();
};

describe('calls-history-info-popup', () => {
	beforeEach(() => {
		vi.useFakeTimers({
			toFake: [
				'setTimeout',
			],
		});
		getCallInfo.mockReset();
		getCallInfo.mockResolvedValue(callInfo);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('loads info of the main call', () => {
		mountPopup();

		expect(getCallInfo).toHaveBeenCalledWith('parent');
	});

	it('does not load anything for a call without id', () => {
		mountPopup({});

		expect(getCallInfo).not.toHaveBeenCalled();
	});

	it('shows a loader until the info arrives', async () => {
		const wrapper = mountPopup();
		await flushPromises();

		expect(wrapper.find('.loader').exists()).toBe(true);
		expect(activeTabOf(wrapper).exists()).toBe(false);

		await settle();

		expect(wrapper.find('.loader').exists()).toBe(false);
		expect(activeTabOf(wrapper).exists()).toBe(true);
	});

	it('offers variables, postprocessing and transcription tabs', () => {
		const wrapper = mountPopup();

		const tabs = tabsOf(wrapper).props('tabs') as {
			value: CallInfoTab;
			text: string;
		}[];

		expect(
			tabs.map(({ value, text }) => ({
				value,
				text,
			})),
		).toEqual([
			{
				value: CallInfoTab.Variables,
				text: 'vocabulary.variables',
			},
			{
				value: CallInfoTab.Postprocessing,
				text: 'ui.pages.history.calls.callInfo.postprocessing',
			},
			{
				value: CallInfoTab.Transcription,
				text: 'objects.transcription',
			},
		]);
	});

	it('opens the variables tab with call variables by default', async () => {
		const wrapper = mountPopup();
		await settle();

		expect(tabsOf(wrapper).props('current')).toMatchObject({
			value: CallInfoTab.Variables,
		});
		expect(
			wrapper
				.findComponent({
					name: 'CallsHistoryInfoVariables',
				})
				.props('variables'),
		).toEqual(callInfo.variables);
	});

	it('shows postprocessing forms and agent description on its tab', async () => {
		const wrapper = mountPopup();
		await settle();

		await switchTab(wrapper, CallInfoTab.Postprocessing);

		expect(tabsOf(wrapper).props('current')).toMatchObject({
			value: CallInfoTab.Postprocessing,
		});
		expect(
			wrapper
				.findComponent({
					name: 'CallsHistoryInfoPostprocessing',
				})
				.props(),
		).toEqual({
			forms: callInfo.forms,
			agentDescription: callInfo.agentDescription,
		});
	});

	it('shows transcripts on the transcription tab', async () => {
		const wrapper = mountPopup();
		await settle();

		await switchTab(wrapper, CallInfoTab.Transcription);

		expect(
			wrapper
				.findComponent({
					name: 'CallsHistoryInfoTranscription',
				})
				.props('transcripts'),
		).toEqual(callInfo.transcripts);
	});

	it('does not reload info when switching tabs', async () => {
		const wrapper = mountPopup();
		await settle();

		await switchTab(wrapper, CallInfoTab.Postprocessing);
		await switchTab(wrapper, CallInfoTab.Variables);

		expect(getCallInfo).toHaveBeenCalledTimes(1);
	});

	it.each([
		[
			'the call is not found',
			() => getCallInfo.mockResolvedValue(undefined),
		],
		[
			'loading fails',
			() => getCallInfo.mockRejectedValue(new Error('network')),
		],
	])('shows tabs with no data when %s', async (_, arrange) => {
		arrange();
		const wrapper = mountPopup();
		await settle();

		expect(
			wrapper
				.findComponent({
					name: 'CallsHistoryInfoVariables',
				})
				.props('variables'),
		).toBeUndefined();
	});

	it.each([
		[
			'popup close',
			'.popup-close',
		],
		[
			'close button',
			'.close-button',
		],
	])('emits close on %s', async (_, selector) => {
		const wrapper = mountPopup();

		await wrapper.find(selector).trigger('click');

		expect(wrapper.emitted('close')).toHaveLength(1);
	});
});
