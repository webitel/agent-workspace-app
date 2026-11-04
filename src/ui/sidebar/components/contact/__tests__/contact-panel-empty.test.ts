import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import EmptyStateBlock from '../../../../components/empty-state-block/empty-state-block.vue';
import ContactPanelEmpty from '../contact-panel-empty.vue';

const mountPanel = (slots: Record<string, string> = {}) =>
	mount(ContactPanelEmpty, {
		props: {
			title: 'Select a contact',
			text: 'Choose a record',
		},
		slots,
		global: {
			stubs: {
				WtImage: true,
			},
		},
	});

describe('contact-panel-empty', () => {
	it('passes the texts through to the empty state block', () => {
		const block = mountPanel().findComponent(EmptyStateBlock);

		expect(block.props('title')).toBe('Select a contact');
		expect(block.props('text')).toBe('Choose a record');
	});

	/**
	 * Forwarding an empty #actions template would still count as a passed slot
	 * and leave an empty, padded actions block - the slot is forwarded only
	 * when it is actually given.
	 */
	it('renders no actions block without the actions slot', () => {
		const wrapper = mountPanel();

		expect(wrapper.find('.empty-state-block__actions').exists()).toBe(false);
	});

	it('forwards the actions slot to the empty state block', () => {
		const wrapper = mountPanel({
			actions: '<button>Create</button>',
		});

		expect(wrapper.find('.empty-state-block__actions button').text()).toBe(
			'Create',
		);
	});
});
