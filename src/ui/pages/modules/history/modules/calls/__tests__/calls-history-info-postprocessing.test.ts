import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import CallsHistoryInfoPostprocessing from '../calls-history-info-postprocessing.vue';
import type { CallInfoForm } from '../types/CallInfo.types';

const stubs = {
	'wt-icon': true,
	'wt-divider': {
		template: '<hr class="divider" />',
	},
	'wt-empty': {
		props: [
			'text',
		],
		template: '<div class="empty">{{ text }}</div>',
	},
};

const form = (
	fields: Record<string, string>,
	agentName?: string,
): CallInfoForm => ({
	agent: agentName
		? {
				name: agentName,
			}
		: undefined,
	fields: Object.entries(fields).map(([key, value]) => ({
		key,
		value,
	})),
});

const mountTab = (props: {
	forms?: CallInfoForm[];
	agentDescription?: string;
}) =>
	mount(CallsHistoryInfoPostprocessing, {
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

const sectionsOf = (wrapper: ReturnType<typeof mountTab>) =>
	wrapper.findAll('li').map((section) => ({
		agent: section.find('.calls-history-info-postprocessing__agent').exists()
			? section.find('.calls-history-info-postprocessing__agent').text()
			: undefined,
		fields: section
			.findAll('.calls-history-info-postprocessing__field')
			.map((field) => field.text()),
	}));

describe('calls-history-info-postprocessing', () => {
	it('shows each form as a section with its agent and fields', () => {
		const wrapper = mountTab({
			forms: [
				form(
					{
						status: 'done',
						note: 'ok',
					},
					'Polina',
				),
			],
		});

		expect(sectionsOf(wrapper)).toEqual([
			{
				agent: 'Polina',
				fields: [
					'status: done',
					'note: ok',
				],
			},
		]);
	});

	it('separates fields inside a section with dividers', () => {
		const wrapper = mountTab({
			forms: [
				form({
					a: '1',
					b: '2',
					c: '3',
				}),
			],
		});

		expect(wrapper.findAll('.divider')).toHaveLength(2);
	});

	it('shows the agent description as the first section', () => {
		const wrapper = mountTab({
			agentDescription: 'callback later',
			forms: [
				form(
					{
						status: 'done',
					},
					'Polina',
				),
			],
		});

		expect(sectionsOf(wrapper)).toEqual([
			{
				agent: undefined,
				fields: [
					'ui.pages.history.calls.callInfo.agentDescription: callback later',
				],
			},
			{
				agent: 'Polina',
				fields: [
					'status: done',
				],
			},
		]);
	});

	it('shows the agent description alone when there are no forms', () => {
		const wrapper = mountTab({
			agentDescription: 'callback later',
		});

		expect(sectionsOf(wrapper)).toHaveLength(1);
		expect(wrapper.find('.empty').exists()).toBe(false);
	});

	it.each([
		[
			'no data',
			{},
		],
		[
			'empty forms',
			{
				forms: [],
			},
		],
		[
			'an empty agent description',
			{
				forms: [],
				agentDescription: '',
			},
		],
	])('shows the empty state for %s', (_, props) => {
		const wrapper = mountTab(props);

		expect(wrapper.find('li').exists()).toBe(false);
		expect(wrapper.find('.empty').text()).toBe('ui.reusable.nothingToShowHere');
	});
});
