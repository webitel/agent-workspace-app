import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import type { EngineTranscriptLookup } from '@webitel/api-services/gen/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TranscriptPhrase } from '../types/CallInfo.types';

const getTranscriptPhrases = vi.fn();

vi.mock('../api/transcriptApi', () => ({
	getTranscriptPhrases: (id: string) => getTranscriptPhrases(id),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: {
			data: Array,
		},
		template:
			'<table><tr v-for="row in data" class="row">{{ row.phrase }}</tr></table>',
	},
}));

import CallsHistoryInfoTranscription from '../calls-history-info-transcription.vue';

const stubs = {
	'wt-single-select': {
		name: 'WtSingleSelect',
		props: [
			'modelValue',
			'options',
		],
		emits: [
			'update:modelValue',
		],
		template: '<div class="select" />',
	},
	'wt-loader': {
		template: '<div class="loader" />',
	},
	'wt-empty': {
		props: [
			'text',
		],
		template: '<div class="empty">{{ text }}</div>',
	},
};

const transcripts: EngineTranscriptLookup[] = [
	{
		id: 't1',
		file: {
			name: 'first.mp3',
		},
	},
	{
		id: 't2',
		file: {
			name: 'second.mp3',
		},
	},
];

const phrases = (...texts: string[]): TranscriptPhrase[] =>
	texts.map((phrase, id) => ({
		id,
		time: '0 - 1',
		phrase,
	}));

/**
 * A request the test resolves or rejects by hand, to control
 * the order in which responses come back
 */
const deferred = () => {
	let resolve: (value: TranscriptPhrase[]) => void = () => {};
	let reject: (reason: unknown) => void = () => {};
	const promise = new Promise<TranscriptPhrase[]>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {
		promise,
		resolve,
		reject,
	};
};

const mountTab = (props: { transcripts?: EngineTranscriptLookup[] }) =>
	mount(CallsHistoryInfoTranscription, {
		props,
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const selectOf = (wrapper: ReturnType<typeof mountTab>) =>
	wrapper.findComponent({
		name: 'WtSingleSelect',
	});

const phrasesOf = (wrapper: ReturnType<typeof mountTab>) =>
	wrapper.findAll('.row').map((row) => row.text());

// lets responses arrive and the loader's minimum duration pass
const settle = async () => {
	await flushPromises();
	await vi.runAllTimersAsync();
};

describe('calls-history-info-transcription', () => {
	beforeEach(() => {
		vi.useFakeTimers({
			toFake: [
				'setTimeout',
			],
		});
		getTranscriptPhrases.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it.each([
		[
			'no transcripts',
			undefined,
		],
		[
			'an empty transcripts list',
			[],
		],
	])('shows the empty state and loads nothing for %s', (_, list) => {
		const wrapper = mountTab({
			transcripts: list,
		});

		expect(wrapper.find('.empty').text()).toBe('ui.reusable.nothingToShowHere');
		expect(wrapper.find('.select').exists()).toBe(false);
		expect(getTranscriptPhrases).not.toHaveBeenCalled();
	});

	it('offers every transcript by its file name', () => {
		getTranscriptPhrases.mockResolvedValue([]);
		const wrapper = mountTab({
			transcripts,
		});

		expect(selectOf(wrapper).props('options')).toEqual([
			{
				id: 't1',
				label: 'first.mp3',
			},
			{
				id: 't2',
				label: 'second.mp3',
			},
		]);
	});

	it('selects and loads the first transcript right away', async () => {
		getTranscriptPhrases.mockResolvedValue(phrases('Hello'));
		const wrapper = mountTab({
			transcripts,
		});

		expect(selectOf(wrapper).props('modelValue')).toBe('t1');
		expect(getTranscriptPhrases).toHaveBeenCalledWith('t1');

		await settle();

		expect(phrasesOf(wrapper)).toEqual([
			'Hello',
		]);
	});

	it('shows a loader while phrases are loading', async () => {
		const request = deferred();
		getTranscriptPhrases.mockReturnValue(request.promise);
		const wrapper = mountTab({
			transcripts,
		});
		await flushPromises();

		expect(wrapper.find('.loader').exists()).toBe(true);

		request.resolve(phrases('Hello'));
		await settle();

		expect(wrapper.find('.loader').exists()).toBe(false);
	});

	it('loads phrases of a newly selected transcript', async () => {
		getTranscriptPhrases.mockImplementation(async (id: string) =>
			phrases(`phrase of ${id}`),
		);
		const wrapper = mountTab({
			transcripts,
		});
		await settle();

		await selectOf(wrapper).vm.$emit('update:modelValue', 't2');
		await settle();

		expect(getTranscriptPhrases).toHaveBeenLastCalledWith('t2');
		expect(phrasesOf(wrapper)).toEqual([
			'phrase of t2',
		]);
	});

	it('shows no phrases when loading fails', async () => {
		getTranscriptPhrases.mockRejectedValue(new Error('network'));
		const wrapper = mountTab({
			transcripts,
		});
		await settle();

		expect(phrasesOf(wrapper)).toEqual([]);
	});

	describe('when responses come back out of order', () => {
		it('ignores a late response for a previous transcript', async () => {
			const first = deferred();
			const second = deferred();
			getTranscriptPhrases
				.mockReturnValueOnce(first.promise)
				.mockReturnValueOnce(second.promise);
			const wrapper = mountTab({
				transcripts,
			});

			await selectOf(wrapper).vm.$emit('update:modelValue', 't2');
			second.resolve(phrases('second'));
			await settle();
			first.resolve(phrases('first'));
			await settle();

			expect(phrasesOf(wrapper)).toEqual([
				'second',
			]);
		});

		it('ignores a late failure for a previous transcript', async () => {
			const first = deferred();
			const second = deferred();
			getTranscriptPhrases
				.mockReturnValueOnce(first.promise)
				.mockReturnValueOnce(second.promise);
			const wrapper = mountTab({
				transcripts,
			});

			await selectOf(wrapper).vm.$emit('update:modelValue', 't2');
			second.resolve(phrases('second'));
			await settle();
			first.reject(new Error('network'));
			await settle();

			expect(phrasesOf(wrapper)).toEqual([
				'second',
			]);
		});
	});
});
