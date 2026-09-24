import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormText from '../fields/processing-form-text.vue';

const stubs = {
	'wt-icon': true,
	'wt-hint': true,
	'wt-copy-action': true,
	// the parent's @click falls through to the root button
	'wt-icon-btn': {
		template: '<button class="toggle" />',
	},
};

const mountText = (props: Record<string, unknown>) =>
	mount(ProcessingFormText, {
		props,
		global: {
			stubs,
		},
	});

const content = (wrapper: ReturnType<typeof mountText>) =>
	wrapper.find('.processing-form-text__content');

// v-show toggles an inline display:none; isVisible() would need a mounted DOM
const isShown = (wrapper: ReturnType<typeof mountText>) =>
	!content(wrapper).attributes('style')?.includes('display: none');

describe('processing-form-text', () => {
	it('renders its initialValue as markdown', () => {
		const wrapper = mountText({
			initialValue: '**Greet** the customer',
		});

		expect(content(wrapper).html()).toContain('<strong>Greet</strong>');
	});

	it('strips script and event handlers from the rendered html', () => {
		const wrapper = mountText({
			initialValue: '<img src="x" onerror="alert(1)"><script>alert(2)</script>',
		});

		const html = content(wrapper).html();
		expect(html).not.toContain('onerror');
		expect(html).not.toContain('<script');
	});

	it('opens links in a new tab without an opener', () => {
		const wrapper = mountText({
			initialValue: '[docs](https://webitel.com)',
		});

		const link = content(wrapper).find('a');
		expect(link.attributes('target')).toBe('_blank');
		expect(link.attributes('rel')).toBe('noopener noreferrer');
	});

	it('starts collapsed when collapsible and expands on toggle', async () => {
		const wrapper = mountText({
			initialValue: 'details',
			collapsible: true,
		});
		expect(isShown(wrapper)).toBe(false);

		await wrapper.find('.toggle').trigger('click');

		expect(isShown(wrapper)).toBe(true);
	});

	it('maps deprecated color names onto the current ones', () => {
		const wrapper = mountText({
			initialValue: 'careful',
			color: 'danger',
		});

		expect(wrapper.classes()).toContain('processing-form-text--error');
	});
});
