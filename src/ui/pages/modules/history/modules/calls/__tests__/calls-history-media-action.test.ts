import { mount } from '@vue/test-utils';
import {
	type EngineCallFile,
	EngineCallFileType,
} from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import CallsHistoryMediaAction from '../calls-history-media-action.vue';

const stubs = {
	'wt-icon': true,
	'wt-icon-btn': {
		props: [
			'disabled',
			'icon',
		],
		emits: [
			'click',
		],
		template:
			'<button class="play-button" :disabled="disabled" @click="$emit(\'click\')" />',
	},
	'wt-context-menu': {
		props: [
			'options',
		],
		emits: [
			'click',
		],
		template: `<div class="context-menu">
			<slot name="activator" :toggle="() => {}" />
			<button
				v-for="option in options"
				class="menu-option"
				:data-icon="option.icon"
				@click="$emit('click', { option })"
			>{{ option.text }}</button>
		</div>`,
	},
};

const file = (id: string, type: EngineCallFileType): EngineCallFile => ({
	id,
	type,
});

const audio = file('audio', EngineCallFileType.FileTypeAudio);
const video = file('video', EngineCallFileType.FileTypeVideo);
const screenshot = file('screenshot', EngineCallFileType.FileTypeScreenshot);

const mountAction = (files?: EngineCallFile[]) =>
	mount(CallsHistoryMediaAction, {
		props: {
			files,
		},
		global: {
			stubs,
		},
	});

describe('calls-history-media-action', () => {
	it.each([
		[
			'no files',
			undefined,
		],
		[
			'only non-playable files',
			[
				screenshot,
			],
		],
	])('shows a disabled play button for %s', (_, files) => {
		const wrapper = mountAction(files);

		expect(wrapper.find('.play-button').attributes('disabled')).toBeDefined();
		expect(wrapper.find('.context-menu').exists()).toBe(false);
	});

	it('plays the only recording right away', async () => {
		const wrapper = mountAction([
			screenshot,
			audio,
		]);

		await wrapper.find('.play-button').trigger('click');

		expect(wrapper.find('.context-menu').exists()).toBe(false);
		expect(wrapper.emitted('play')).toEqual([
			[
				audio,
			],
		]);
	});

	it('offers a menu with every recording, audio first', () => {
		const wrapper = mountAction([
			video,
			screenshot,
			audio,
		]);

		const options = wrapper.findAll('.menu-option');

		expect(options.map((option) => option.text())).toEqual([
			'ui.pages.history.calls.recordings.playAudio',
			'ui.pages.history.calls.recordings.playVideo',
		]);
		expect(options.map((option) => option.attributes('data-icon'))).toEqual([
			'play',
			'ws-play-video',
		]);
	});

	it('does not play anything until a recording is picked in the menu', async () => {
		const wrapper = mountAction([
			audio,
			video,
		]);

		await wrapper.find('.play-button').trigger('click');

		expect(wrapper.emitted('play')).toBeUndefined();
	});

	it('plays the recording picked in the menu', async () => {
		const wrapper = mountAction([
			audio,
			video,
		]);

		await wrapper.findAll('.menu-option')[1].trigger('click');

		expect(wrapper.emitted('play')).toEqual([
			[
				video,
			],
		]);
	});
});
