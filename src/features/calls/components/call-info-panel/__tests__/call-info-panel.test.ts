import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { CallDirection } from 'webitel-sdk';

import type { CallInfoPanelContent } from '../../../types/CallInfoPanelContent.types';
import CallInfoPanel from '../call-info-panel.vue';
import InboundCallInfoPanel from '../inbound-call-info-panel.vue';

const mountPanel = (content: CallInfoPanelContent) =>
	mount(CallInfoPanel, {
		props: {
			content,
		},
		global: {
			stubs: {
				InboundCallInfoPanel: true,
			},
		},
	});

describe('call-info-panel', () => {
	it('shows the inbound panel for an inbound call', () => {
		const content: CallInfoPanelContent = {
			direction: CallDirection.Inbound,
			from: '+12023417842',
		};
		const wrapper = mountPanel(content);

		expect(
			wrapper.findComponent(InboundCallInfoPanel).props('content'),
		).toEqual(content);
	});

	it('shows nothing for a direction without its own panel', () => {
		const wrapper = mountPanel({
			direction: CallDirection.Outbound,
		});

		expect(wrapper.findComponent(InboundCallInfoPanel).exists()).toBe(false);
		expect(wrapper.html()).toBe('<!--v-if-->');
	});

	it('shows nothing for a call without a direction', () => {
		const wrapper = mountPanel({});

		expect(wrapper.html()).toBe('<!--v-if-->');
	});
});
