import { mount } from '@vue/test-utils';
import type {
	EngineCallFile,
	EngineHistoryCall,
} from '@webitel/api-services/gen/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CallsHistoryRowActions from '../calls-history-row-actions.vue';
import { CallMenuAction } from '../enums/CallMenuAction.enum';

const stubs = {
	'wt-icon': true,
	'wt-icon-btn': true,
	'calls-history-media-action': {
		props: [
			'files',
		],
		emits: [
			'play',
		],
		template: '<div class="media-action" />',
	},
	'wt-context-menu': {
		props: [
			'options',
		],
		emits: [
			'click',
		],
		template: `<div class="context-menu">
			<button
				v-for="option in options"
				class="menu-option"
				:data-value="option.value"
				@click="$emit('click', { option })"
			>{{ option.text }}</button>
		</div>`,
	},
};

const item: EngineHistoryCall = {
	id: 'child',
	parentId: 'parent',
	files: [
		{
			id: 'audio',
		},
	],
};

const mountActions = () =>
	mount(CallsHistoryRowActions, {
		props: {
			item,
		},
		global: {
			stubs,
		},
	});

const clickMenuOption = (
	wrapper: ReturnType<typeof mountActions>,
	action: CallMenuAction,
) => wrapper.find(`.menu-option[data-value="${action}"]`).trigger('click');

describe('calls-history-row-actions', () => {
	beforeEach(() => {
		vi.stubEnv('VITE_HISTORY_URL', 'https://history.test');
		vi.spyOn(window, 'open').mockImplementation(() => null);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('passes the call files to the media action', () => {
		const wrapper = mountActions();

		expect(
			wrapper.findComponent(stubs['calls-history-media-action']).props('files'),
		).toEqual(item.files);
	});

	it('re-emits play from the media action', () => {
		const wrapper = mountActions();
		const file: EngineCallFile = {
			id: 'audio',
		};

		wrapper
			.findComponent(stubs['calls-history-media-action'])
			.vm.$emit('play', file);

		expect(wrapper.emitted('play')).toEqual([
			[
				file,
			],
		]);
	});

	it('offers call info and open in history', () => {
		const wrapper = mountActions();

		expect(
			wrapper.findAll('.menu-option').map((option) => option.text()),
		).toEqual([
			'ui.pages.history.calls.actions.showCallInfo',
			'reusable.openInHistory',
		]);
	});

	it('asks to show call info for the row', async () => {
		const wrapper = mountActions();

		await clickMenuOption(wrapper, CallMenuAction.ShowCallInfo);

		expect(wrapper.emitted('show-info')).toEqual([
			[
				item,
			],
		]);
		expect(window.open).not.toHaveBeenCalled();
	});

	it('opens the main call in History in a new tab', async () => {
		const wrapper = mountActions();

		await clickMenuOption(wrapper, CallMenuAction.OpenInHistory);

		expect(window.open).toHaveBeenCalledWith(
			'https://history.test/view/call_view/parent',
			'_blank',
			'noopener',
		);
		expect(wrapper.emitted('show-info')).toBeUndefined();
	});
});
