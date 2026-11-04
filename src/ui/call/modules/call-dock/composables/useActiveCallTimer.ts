import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';

import { useElapsedSec } from '../../../../composables/useElapsedSec';

/**
 * @author Oleksandr Palonnyi
 * the call timer counts from the absolute `answeredAt`, so it stays right
 * across re-renders and tab sleep. the SDK exposes no start of the hold, so the
 * hold timer counts from the moment this composable saw `isHold` turn on; a
 * page reload during a hold restarts it from zero
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
export function useActiveCallTimer({
	answeredAt,
	isHold,
}: {
	answeredAt: MaybeRefOrGetter<number>;
	isHold: MaybeRefOrGetter<boolean>;
}) {
	const holdStartedAt = ref<number | null>(null);

	watch(
		() => toValue(isHold),
		(isOnHold) => {
			holdStartedAt.value = isOnHold ? Date.now() : null;
		},
		{
			immediate: true,
		},
	);

	const elapsedSec = useElapsedSec(
		() => holdStartedAt.value ?? toValue(answeredAt),
	);

	/**
	 * @author Oleksandr Palonnyi
	 * the hours segment is always shown (00:05:52, as in the design), which also
	 * keeps the width fixed as the timer ticks past an hour
	 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
	 */
	const formatted = computed(() => convertDuration(elapsedSec.value));

	return {
		elapsedSec,
		formatted,
	};
}
