import { mount } from '@vue/test-utils';
import { WtButton } from '@webitel/ui-sdk/components';
import { describe, expect, it } from 'vitest';

import { OfferKind } from '../../../types/Offer.types';
import OfferActions from '../offer-actions.vue';

const mountActions = (props: Record<string, unknown> = {}) =>
	mount(OfferActions, {
		props: {
			kind: OfferKind.Call,
			...props,
		},
	});

describe('offer-actions', () => {
	it.each([
		[
			OfferKind.Call,
			'call',
			'call-end',
		],
		[
			OfferKind.Chat,
			'chat',
			'chat-end',
		],
	])('uses the %s channel icons', (kind, accept, decline) => {
		const [acceptButton, declineButton] = mountActions({
			kind,
		}).findAllComponents(WtButton);

		expect(acceptButton.props('icon')).toBe(accept);
		expect(declineButton.props('icon')).toBe(decline);
	});

	// icon-only buttons carry no text, so the name has to come from aria-label
	it('names both actions for assistive tech', () => {
		const [acceptButton, declineButton] =
			mountActions().findAllComponents(WtButton);

		expect(acceptButton.attributes('aria-label')).toBe(
			'ui.notifications.offer.accept',
		);
		expect(declineButton.attributes('aria-label')).toBe(
			'ui.notifications.offer.decline',
		);
	});

	it('emits the action that was pressed', async () => {
		const wrapper = mountActions();
		const [acceptButton, declineButton] = wrapper.findAllComponents(WtButton);

		await acceptButton.vm.$emit('click');
		await declineButton.vm.$emit('click');

		expect(wrapper.emitted('accept')).toHaveLength(1);
		expect(wrapper.emitted('decline')).toHaveLength(1);
	});

	it('leaves both actions live while nothing is in flight', () => {
		const [acceptButton, declineButton] =
			mountActions().findAllComponents(WtButton);

		expect(acceptButton.props('disabled')).toBe(false);
		expect(declineButton.props('disabled')).toBe(false);
	});

	/**
	 * The lock is what keeps the SDK from being asked twice — it replaced the
	 * optimistic dismiss that used to serve as the double-click guard.
	 */
	it.each([
		[
			'accept' as const,
			0,
		],
		[
			'decline' as const,
			1,
		],
	])('locks both actions while %s is in flight', (pending, pressedIndex) => {
		const buttons = mountActions({
			pending,
		}).findAllComponents(WtButton);

		expect(buttons.map((button) => button.props('disabled'))).toEqual([
			true,
			true,
		]);
		expect(buttons.map((button) => button.props('loading'))).toEqual(
			buttons.map((_button, index) => index === pressedIndex),
		);
	});
});
