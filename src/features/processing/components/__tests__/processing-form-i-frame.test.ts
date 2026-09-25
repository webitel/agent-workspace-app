import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ProcessingFormIFrame from '../fields/processing-form-i-frame.vue';

const mountFrame = (props: Record<string, unknown>) =>
	mount(ProcessingFormIFrame, {
		props,
		global: {
			stubs: {
				'wt-label': {
					template: '<label class="label"><slot /></label>',
				},
			},
		},
	});

describe('processing-form-i-frame', () => {
	it('embeds initialValue at the requested height', () => {
		const frame = mountFrame({
			initialValue: 'https://example.com/crm',
			height: '240px',
		}).find('iframe');

		expect(frame.attributes('src')).toBe('https://example.com/crm');
		expect(frame.attributes('style')).toContain('height: 240px');
	});

	it('refuses anything but an http(s) URL', () => {
		for (const initialValue of [
			'javascript:alert(document.cookie)',
			'data:text/html,<script>alert(1)</script>',
			'not a url',
		]) {
			expect(
				mountFrame({
					initialValue,
				})
					.find('iframe')
					.attributes('src'),
			).toBe('about:blank');
		}
	});

	it('shows a label only when the form gives one', () => {
		expect(
			mountFrame({
				initialValue: 'https://example.com',
			})
				.find('.label')
				.exists(),
		).toBe(false);
		expect(
			mountFrame({
				initialValue: 'https://example.com',
				label: 'Customer card',
			})
				.find('.label')
				.text(),
		).toBe('Customer card');
	});
});
