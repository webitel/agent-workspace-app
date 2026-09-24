import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import { OfferKind, type OfferPreview } from '../../types/Offer.types';
import { useOffersStore } from '../offers';

const ringtone = {
	start: vi.fn(),
	stop: vi.fn(),
};
const chirp = {
	play: vi.fn(),
};
const osNotifications = {
	initialize: vi.fn(),
	show: vi.fn(),
	close: vi.fn(),
};

vi.mock('../../../sound/composables/useRingtone', () => ({
	useRingtone: () => ringtone,
}));
vi.mock('../../../sound/composables/useOfferChirp', () => ({
	useOfferChirp: () => chirp,
}));
vi.mock('../../../push/composables/useOsNotifications', () => ({
	useOsNotifications: () => osNotifications,
}));
vi.mock('../../../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildPreview = (overrides: Partial<OfferPreview> = {}): OfferPreview => ({
	kind: OfferKind.Call,
	name: 'John Smith',
	identifier: '380671234678',
	waitingSince: Date.now(),
	...overrides,
});

const buildOffer = (id = 'call-1') => ({
	id,
	preview: buildPreview(),
	onAccept: vi.fn(),
	onDecline: vi.fn(),
});

describe('useOffersStore', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		ringtone.start.mockClear();
		ringtone.stop.mockClear();
		chirp.play.mockClear();
		osNotifications.show.mockClear();
		osNotifications.close.mockClear();
	});

	it('adds an offer and starts the ringtone', () => {
		const store = useOffersStore();

		store.notify(buildOffer());

		expect(store.offers).toHaveLength(1);
		expect(store.hasOffers).toBe(true);
		expect(ringtone.start).toHaveBeenCalledTimes(1);
		expect(osNotifications.show).toHaveBeenCalledTimes(1);
	});

	it('ignores a repeat offer for the same interaction', () => {
		const store = useOffersStore();

		store.notify(buildOffer());
		store.notify(buildOffer());

		expect(store.offers).toHaveLength(1);
		expect(osNotifications.show).toHaveBeenCalledTimes(1);
	});

	it('stacks several offers but keeps a single ring', () => {
		const store = useOffersStore();

		store.notify(buildOffer('call-1'));
		store.notify(buildOffer('call-2'));

		expect(store.offers).toHaveLength(2);
		// start() is idempotent in the ringtone itself; the point is one loop
		expect(ringtone.start).toHaveBeenCalledTimes(2);
	});

	it('keeps ringing while any offer remains, stops on the last', () => {
		const store = useOffersStore();

		store.notify(buildOffer('call-1'));
		store.notify(buildOffer('call-2'));

		store.dismiss('call-1');
		expect(ringtone.stop).not.toHaveBeenCalled();

		store.dismiss('call-2');
		expect(ringtone.stop).toHaveBeenCalledTimes(1);
	});

	it('closes the OS notification when an offer goes away', () => {
		const store = useOffersStore();

		store.notify(buildOffer('call-1'));
		store.dismiss('call-1');

		expect(osNotifications.close).toHaveBeenCalledWith('call-1');
	});

	it('runs the right handler when one of several offers is accepted', async () => {
		const store = useOffersStore();
		const first = buildOffer('call-1');
		const second = buildOffer('call-2');

		store.notify(first);
		store.notify(second);
		await store.accept('call-2');

		expect(second.onAccept).toHaveBeenCalledTimes(1);
		expect(first.onAccept).not.toHaveBeenCalled();
	});

	it('declines through the matching handler', async () => {
		const store = useOffersStore();
		const offer = buildOffer();

		store.notify(offer);
		await store.decline('call-1');

		expect(offer.onDecline).toHaveBeenCalledTimes(1);
	});

	/**
	 * Offers are derived: the producer's feed drops the interaction and
	 * `retainOnly` removes the card. Dismissing here would hide the failure
	 * path, where the call is still ringing.
	 */
	it('leaves the card to the producer instead of dismissing it', async () => {
		const store = useOffersStore();

		store.notify(buildOffer());
		await store.accept('call-1');

		expect(store.offers).toHaveLength(1);
		expect(ringtone.stop).not.toHaveBeenCalled();
		expect(osNotifications.close).not.toHaveBeenCalled();
	});

	it('marks the pressed action as pending until the handler settles', async () => {
		const store = useOffersStore();
		let settle: () => void = () => {};
		const offer = {
			...buildOffer(),
			onAccept: vi.fn(
				() =>
					new Promise<void>((resolve) => {
						settle = resolve;
					}),
			),
		};

		store.notify(offer);
		const accepted = store.accept('call-1');

		expect(store.pendingAction('call-1')).toBe('accept');

		settle();
		await accepted;

		expect(store.pendingAction('call-1')).toBeUndefined();
	});

	it('cannot accept the same offer twice while the first is in flight', async () => {
		const store = useOffersStore();
		let settle: () => void = () => {};
		const offer = {
			...buildOffer(),
			onAccept: vi.fn(
				() =>
					new Promise<void>((resolve) => {
						settle = resolve;
					}),
			),
		};

		store.notify(offer);
		const accepted = store.accept('call-1');
		await store.accept('call-1');
		await store.decline('call-1');

		expect(offer.onAccept).toHaveBeenCalledTimes(1);
		expect(offer.onDecline).not.toHaveBeenCalled();

		settle();
		await accepted;
	});

	it('keeps the offer and clears the marker when the handler rejects', async () => {
		const consoleError = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		const store = useOffersStore();
		const offer = {
			...buildOffer(),
			onAccept: vi.fn(() => Promise.reject(new Error('mic denied'))),
		};

		store.notify(offer);
		await store.accept('call-1');

		expect(store.offers).toHaveLength(1);
		expect(store.pendingAction('call-1')).toBeUndefined();
		expect(consoleError).toHaveBeenCalled();

		consoleError.mockRestore();
	});

	describe('per-channel sound', () => {
		const buildChatInteraction = (id = 'chat-1') => ({
			...buildOffer(id),
			preview: buildPreview({
				kind: OfferKind.Chat,
			}),
		});

		it('rings for a call offer and does not chirp', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));

			expect(ringtone.start).toHaveBeenCalledTimes(1);
			expect(chirp.play).not.toHaveBeenCalled();
		});

		it('chirps for a chat offer and does not ring', () => {
			const store = useOffersStore();

			store.notify(buildChatInteraction());

			expect(chirp.play).toHaveBeenCalledTimes(1);
			expect(ringtone.start).not.toHaveBeenCalled();
		});

		/** A call has a deadline; a text chat must not talk over it. */
		it('stays silent for a chat that arrives during a ringing call', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.notify(buildChatInteraction());

			expect(chirp.play).not.toHaveBeenCalled();
		});

		it('chirps again once the ringing call is gone', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.dismiss('call-1');
			store.notify(buildChatInteraction());

			expect(chirp.play).toHaveBeenCalledTimes(1);
		});

		it('keeps ringing while a call remains, even as chats come and go', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.notify(buildChatInteraction());
			store.dismiss('chat-1');

			expect(ringtone.stop).not.toHaveBeenCalled();
		});

		/** A lingering chat offer must not hold the ringtone open. */
		it('stops the ringtone when the last call goes, even with a chat left', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.notify(buildChatInteraction());
			store.dismiss('call-1');

			expect(ringtone.stop).toHaveBeenCalledTimes(1);
			expect(store.offers).toHaveLength(1);
		});

		/**
		 * `stop()` is idempotent and only releases a lock this tab owns, so calling
		 * it when nothing rings is harmless — but it must still be reached, or a
		 * ring left over from a call that resolved in an odd order would persist.
		 */
		it('settles the ringtone off when no call offer remains', () => {
			const store = useOffersStore();

			store.notify(buildChatInteraction());
			ringtone.stop.mockClear();
			store.dismiss('chat-1');

			expect(ringtone.stop).toHaveBeenCalledTimes(1);
		});
	});

	describe('retainOnly', () => {
		it('dismisses offers that are no longer on the wire', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.notify(buildOffer('call-2'));

			store.retainOnly(OfferKind.Call, [
				'call-2',
			]);

			expect(store.offers.map(({ id }) => id)).toEqual([
				'call-2',
			]);
		});

		/**
		 * Producers own their own channel. Without the kind scope, a call-feed
		 * update would dismiss every chat offer the moment WS-19 lands.
		 */
		it("leaves another channel's offers alone", () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.notify({
				...buildOffer('chat-1'),
				preview: buildPreview({
					kind: OfferKind.Chat,
				}),
			});

			store.retainOnly(OfferKind.Call, []);

			expect(store.offers.map(({ id }) => id)).toEqual([
				'chat-1',
			]);
		});

		it('keeps everything when all offers are still live', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.notify(buildOffer('call-2'));

			store.retainOnly(OfferKind.Call, [
				'call-1',
				'call-2',
			]);

			expect(store.offers).toHaveLength(2);
			expect(ringtone.stop).not.toHaveBeenCalled();
		});

		it('stops the ringtone once the last offer is withdrawn', () => {
			const store = useOffersStore();

			store.notify(buildOffer('call-1'));
			store.retainOnly(OfferKind.Call, []);

			expect(store.offers).toHaveLength(0);
			expect(ringtone.stop).toHaveBeenCalledTimes(1);
		});
	});

	it('ignores dismissing an unknown interaction', () => {
		const store = useOffersStore();

		store.dismiss('nope');

		expect(osNotifications.close).not.toHaveBeenCalled();
	});

	/**
	 * The preview must stay live — a snapshot would freeze the waiting timer and
	 * any late-arriving contact identification.
	 */
	it('keeps the preview reactive instead of snapshotting it', () => {
		const store = useOffersStore();
		const name = ref('Unknown');
		const preview = computed(() =>
			buildPreview({
				name: name.value,
			}),
		);

		store.notify({
			id: 'call-1',
			preview,
			onAccept: vi.fn(),
			onDecline: vi.fn(),
		});

		name.value = 'John Smith';

		const stored = store.offers[0].preview as typeof preview;
		expect(stored.value.name).toBe('John Smith');
	});
});
