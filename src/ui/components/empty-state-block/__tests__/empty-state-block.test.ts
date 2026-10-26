import { mount } from '@vue/test-utils';
import { WtImage } from '@webitel/ui-sdk/components';
import { describe, expect, it } from 'vitest';

import EmptyStateBlock from '../empty-state-block.vue';

const mountBlock = (
	props: Record<string, unknown> = {},
	slots: Record<string, string> = {},
) =>
	mount(EmptyStateBlock, {
		props: {
			image: 'empty.svg',
			title: 'Nothing here',
			text: 'Try something else',
			...props,
		},
		slots,
		global: {
			components: {
				WtImage,
			},
			stubs: {
				WtImage: true,
			},
		},
	});

describe('empty-state-block', () => {
	it('renders the title and the text', () => {
		const wrapper = mountBlock();

		expect(wrapper.find('.empty-state-block__title').text()).toBe(
			'Nothing here',
		);
		expect(wrapper.find('.empty-state-block__text').text()).toBe(
			'Try something else',
		);
	});

	it('passes the image and its width through to wt-image', () => {
		const wrapper = mountBlock({
			width: '80px',
		});

		const image = wrapper.findComponent(WtImage);
		expect(image.props('src')).toBe('empty.svg');
		expect(image.props('width')).toBe('80px');
	});

	it('renders no actions block without the actions slot', () => {
		const wrapper = mountBlock();

		expect(wrapper.find('.empty-state-block__actions').exists()).toBe(false);
	});

	it('renders the actions slot inside the actions block', () => {
		const wrapper = mountBlock(
			{},
			{
				actions: '<button>Create</button>',
			},
		);

		expect(wrapper.find('.empty-state-block__actions button').text()).toBe(
			'Create',
		);
	});
});
