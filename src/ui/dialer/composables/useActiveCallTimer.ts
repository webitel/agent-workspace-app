import { useNow } from '@vueuse/core';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';

const TICK_MS = 1000;

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
	const now = useNow({
		interval: TICK_MS,
	});

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

	const elapsedSec = computed(() => {
		const startedAt = holdStartedAt.value ?? toValue(answeredAt);
		return Math.max(0, Math.floor((now.value.getTime() - startedAt) / 1000));
	});

	const formatted = computed(() =>
		convertDuration(elapsedSec.value, {
			alwaysShowHours: false,
		}),
	);

	return {
		elapsedSec,
		formatted,
	};
}
