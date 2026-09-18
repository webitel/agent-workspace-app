import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

import {
	type IncomingInteractionPreview,
	InteractionKind,
} from '../../../types/IncomingInteraction.types';
import { useIncomingInteractionsStore } from '../incomingInteractions';

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

vi.mock('../../../sound/useRingtone', () => ({
	useRingtone: () => ringtone,
}));
vi.mock('../../../sound/useOfferChirp', () => ({
	useOfferChirp: () => chirp,
}));
vi.mock('../../../push/useOsNotifications', () => ({
	useOsNotifications: () => osNotifications,
}));
vi.mock('../../../../../app/locale/i18n', () => ({
	default: {
		global: {
			t: (key: string) => key,
		},
	},
}));

const buildPreview = (
	overrides: Partial<IncomingInteractionPreview> = {},
): IncomingInteractionPreview => ({
	kind: InteractionKind.Call,
	name: 'John Smith',
	identifier: '380671234678',
	waitingSince: Date.now(),
	...overrides,
});

const buildInteraction = (id = 'call-1') => ({
	id,
	preview: buildPreview(),
	onAccept: vi.fn(),
	onDecline: vi.fn(),
});

describe('useIncomingInteractionsStore', () => {
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
		const store = useIncomingInteractionsStore();

		store.notify(buildInteraction());

		expect(store.interactions).toHaveLength(1);
		expect(store.hasInteractions).toBe(true);
		expect(ringtone.start).toHaveBeenCalledTimes(1);
		expect(osNotifications.show).toHaveBeenCalledTimes(1);
	});

	it('ignores a repeat offer for the same interaction', () => {
		const store = useIncomingInteractionsStore();

		store.notify(buildInteraction());
		store.notify(buildInteraction());

		expect(store.interactions).toHaveLength(1);
		expect(osNotifications.show).toHaveBeenCalledTimes(1);
	});

	it('stacks several offers but keeps a single ring', () => {
		const store = useIncomingInteractionsStore();

		store.notify(buildInteraction('call-1'));
		store.notify(buildInteraction('call-2'));

		expect(store.interactions).toHaveLength(2);
		// start() is idempotent in the ringtone itself; the point is one loop
		expect(ringtone.start).toHaveBeenCalledTimes(2);
	});

	it('keeps ringing while any offer remains, stops on the last', () => {
		const store = useIncomingInteractionsStore();

		store.notify(buildInteraction('call-1'));
		store.notify(buildInteraction('call-2'));

		store.dismiss('call-1');
		expect(ringtone.stop).not.toHaveBeenCalled();

		store.dismiss('call-2');
		expect(ringtone.stop).toHaveBeenCalledTimes(1);
	});

	it('closes the OS notification when an offer goes away', () => {
		const store = useIncomingInteractionsStore();

		store.notify(buildInteraction('call-1'));
		store.dismiss('call-1');

		expect(osNotifications.close).toHaveBeenCalledWith('call-1');
	});

	it('runs the right handler when one of several offers is accepted', () => {
		const store = useIncomingInteractionsStore();
		const first = buildInteraction('call-1');
		const second = buildInteraction('call-2');

		store.notify(first);
		store.notify(second);
		store.accept('call-2');

		expect(second.onAccept).toHaveBeenCalledTimes(1);
		expect(first.onAccept).not.toHaveBeenCalled();
		expect(store.interactions).toHaveLength(1);
		expect(store.interactions[0].id).toBe('call-1');
	});

	it('declines through the matching handler', () => {
		const store = useIncomingInteractionsStore();
		const interaction = buildInteraction();

		store.notify(interaction);
		store.decline('call-1');

		expect(interaction.onDecline).toHaveBeenCalledTimes(1);
		expect(store.interactions).toHaveLength(0);
	});

	it('cannot accept the same offer twice', () => {
		const store = useIncomingInteractionsStore();
		const interaction = buildInteraction();

		store.notify(interaction);
		store.accept('call-1');
		store.accept('call-1');

		expect(interaction.onAccept).toHaveBeenCalledTimes(1);
	});

	describe('per-channel sound', () => {
		const buildChatInteraction = (id = 'chat-1') => ({
			...buildInteraction(id),
			preview: buildPreview({
				kind: InteractionKind.Chat,
			}),
		});

		it('rings for a call offer and does not chirp', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));

			expect(ringtone.start).toHaveBeenCalledTimes(1);
			expect(chirp.play).not.toHaveBeenCalled();
		});

		it('chirps for a chat offer and does not ring', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildChatInteraction());

			expect(chirp.play).toHaveBeenCalledTimes(1);
			expect(ringtone.start).not.toHaveBeenCalled();
		});

		/** A call has a deadline; a text chat must not talk over it. */
		it('stays silent for a chat that arrives during a ringing call', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.notify(buildChatInteraction());

			expect(chirp.play).not.toHaveBeenCalled();
		});

		it('chirps again once the ringing call is gone', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.dismiss('call-1');
			store.notify(buildChatInteraction());

			expect(chirp.play).toHaveBeenCalledTimes(1);
		});

		it('keeps ringing while a call remains, even as chats come and go', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.notify(buildChatInteraction());
			store.dismiss('chat-1');

			expect(ringtone.stop).not.toHaveBeenCalled();
		});

		/** A lingering chat offer must not hold the ringtone open. */
		it('stops the ringtone when the last call goes, even with a chat left', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.notify(buildChatInteraction());
			store.dismiss('call-1');

			expect(ringtone.stop).toHaveBeenCalledTimes(1);
			expect(store.interactions).toHaveLength(1);
		});

		/**
		 * `stop()` is idempotent and only releases a lock this tab owns, so calling
		 * it when nothing rings is harmless — but it must still be reached, or a
		 * ring left over from a call that resolved in an odd order would persist.
		 */
		it('settles the ringtone off when no call offer remains', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildChatInteraction());
			ringtone.stop.mockClear();
			store.dismiss('chat-1');

			expect(ringtone.stop).toHaveBeenCalledTimes(1);
		});
	});

	describe('retainOnly', () => {
		it('dismisses offers that are no longer on the wire', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.notify(buildInteraction('call-2'));

			store.retainOnly(InteractionKind.Call, [
				'call-2',
			]);

			expect(store.interactions.map(({ id }) => id)).toEqual([
				'call-2',
			]);
		});

		/**
		 * Producers own their own channel. Without the kind scope, a call-feed
		 * update would dismiss every chat offer the moment WS-19 lands.
		 */
		it("leaves another channel's offers alone", () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.notify({
				...buildInteraction('chat-1'),
				preview: buildPreview({
					kind: InteractionKind.Chat,
				}),
			});

			store.retainOnly(InteractionKind.Call, []);

			expect(store.interactions.map(({ id }) => id)).toEqual([
				'chat-1',
			]);
		});

		it('keeps everything when all offers are still live', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.notify(buildInteraction('call-2'));

			store.retainOnly(InteractionKind.Call, [
				'call-1',
				'call-2',
			]);

			expect(store.interactions).toHaveLength(2);
			expect(ringtone.stop).not.toHaveBeenCalled();
		});

		it('stops the ringtone once the last offer is withdrawn', () => {
			const store = useIncomingInteractionsStore();

			store.notify(buildInteraction('call-1'));
			store.retainOnly(InteractionKind.Call, []);

			expect(store.interactions).toHaveLength(0);
			expect(ringtone.stop).toHaveBeenCalledTimes(1);
		});
	});

	it('ignores dismissing an unknown interaction', () => {
		const store = useIncomingInteractionsStore();

		store.dismiss('nope');

		expect(osNotifications.close).not.toHaveBeenCalled();
	});

	/**
	 * The preview must stay live — a snapshot would freeze the waiting timer and
	 * any late-arriving contact identification.
	 */
	it('keeps the preview reactive instead of snapshotting it', () => {
		const store = useIncomingInteractionsStore();
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

		const stored = store.interactions[0].preview as typeof preview;
		expect(stored.value.name).toBe('John Smith');
	});
});
