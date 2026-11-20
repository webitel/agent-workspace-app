import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import OfferWaitingTime from '../offer-waiting-time.vue';

const secondsAgo = (seconds: number) => Date.now() - seconds * 1000;

describe('offer-waiting-time', () => {
	/** A counter started from the wrong epoch reads as fact, so it stays hidden. */
	it('renders nothing without a trustworthy epoch', () => {
		const wrapper = mount(OfferWaitingTime, {
			props: {},
		});

		expect(wrapper.find('.offer-waiting-time').exists()).toBe(false);
	});

	it('counts up from the epoch it was given', () => {
		const wrapper = mount(OfferWaitingTime, {
			props: {
				waitingSince: secondsAgo(82),
			},
		});

		expect(wrapper.text()).toContain('ui.notifications.offer.waitingTime');
		expect(wrapper.text()).toContain('01:22');
	});

	it('counts down when an accept timeout is available', () => {
		const wrapper = mount(OfferWaitingTime, {
			props: {
				waitingSince: secondsAgo(5),
				maxWaitSec: 20,
				isCountdown: true,
			},
		});

		expect(wrapper.text()).toContain('ui.notifications.offer.timeToAccept');
		expect(wrapper.text()).toContain('00:15');
	});

	// an elapsed timer without a queue limit keeps its counter and hides the bar
	it('keeps the counter and hides the bar without a limit', () => {
		const wrapper = mount(OfferWaitingTime, {
			props: {
				waitingSince: secondsAgo(10),
			},
		});

		expect(wrapper.find('.offer-waiting-time__row').exists()).toBe(true);
		expect(wrapper.find('.offer-waiting-time__track').exists()).toBe(false);
	});

	it.each([
		[
			10,
			1,
			'low',
		],
		[
			50,
			2,
			'medium',
		],
		[
			80,
			4,
			'high',
		],
	])('fills the bar by elapsed share: %ss of 100 -> %s segments', (elapsed, expectedFilled, level) => {
		const wrapper = mount(OfferWaitingTime, {
			props: {
				waitingSince: secondsAgo(elapsed),
				maxWaitSec: 100,
			},
		});

		const filled = wrapper.findAll(`.offer-waiting-time__segment--${level}`);
		expect(filled).toHaveLength(expectedFilled);
		expect(wrapper.findAll('.offer-waiting-time__segment')).toHaveLength(4);
	});
});
