import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Task } from 'webitel-sdk';

import SlideUpOverlay from '../../../../../components/slide-up-overlay/slide-up-overlay.vue';
import type { ActiveCallContent } from '../../types/ActiveCallContent.types';
import CallDock from '../call-dock.vue';
import PostProcessingCallBar from '../post-processing-call-bar.vue';

const preview: ActiveCallContent = {
	name: 'Emily Johnson',
	number: '+12023417842',
	queueName: 'Sales',
	answeredAt: Date.now(),
	isHold: false,
	isMuted: false,
	canTransfer: false,
	dtmfDigits: '',
};

const mountBar = () =>
	mount(PostProcessingCallBar, {
		props: {
			preview,
			task: {
				id: 'task-1',
			} as unknown as Task,
		},
		global: {
			stubs: {
				CallDock: true,
			},
		},
	});

describe('post-processing-call-bar', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
	});

	it('renders the call dock as a hung-up card for the call', () => {
		const dock = mountBar().findComponent(CallDock);

		expect(dock.props('isHungUp')).toBe(true);
		expect(dock.props('preview')).toEqual(preview);
	});

	it('floats the card over the content instead of taking room in the dock', () => {
		const overlay = mountBar().findComponent(SlideUpOverlay);

		expect(overlay.props('isOpen')).toBe(true);
		expect(overlay.findComponent(CallDock).exists()).toBe(true);
	});

	it('opens the Call window from the card', () => {
		const wrapper = mountBar();

		wrapper.findComponent(CallDock).vm.$emit('openFullView');

		expect(wrapper.emitted('openFullView')).toHaveLength(1);
	});
});
