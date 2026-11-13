<template>
	<wt-popup
		:size="ComponentSize.SM"
		@close="callBridgePopupStore.close()"
	>
		<template #title>
			{{ t('ui.call.bridge.title') }}
		</template>

		<template #main>
			<p class="bridge-popup__description typo-body-2">
				{{ t('ui.call.bridge.description') }}
			</p>

			<ul class="bridge-popup__calls">
				<li
					v-for="bridgeTarget in bridgeTargets"
					:key="bridgeTarget.id"
				>
					<button
						type="button"
						class="bridge-popup__call"
						:class="{
							'bridge-popup__call--selected': selectedCallId === bridgeTarget.id,
						}"
						:aria-pressed="selectedCallId === bridgeTarget.id"
						:disabled="isSubmitting"
						@click="selectedCallId = bridgeTarget.id"
					>
						<wt-avatar
							:username="bridgeTarget.name"
							:size="ComponentSize.SM"
						/>
						<span class="bridge-popup__call-identity">
							<span class="bridge-popup__call-name typo-body-2-bold">
								{{ bridgeTarget.name || t('ui.call.bridge.unknownContact') }}
							</span>
							<span
								v-if="bridgeTarget.number"
								class="bridge-popup__call-number typo-caption"
							>
								{{ bridgeTarget.number }}
							</span>
						</span>
					</button>
				</li>
			</ul>
		</template>

		<template #actions>
			<wt-button
				:disabled="isSubmitting || selectedCallId === null"
				@click="connect"
			>
				{{ t('ui.call.bridge.connect') }}
			</wt-button>
			<wt-button
				:color="ButtonColor.SECONDARY"
				@click="callBridgePopupStore.close()"
			>
				{{ t('reusable.cancel') }}
			</wt-button>
		</template>
	</wt-popup>
</template>

<script
	setup
	lang="ts"
>
import { ButtonColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { isActiveCall } from '../../../../../features/calls/scripts/isActiveCall';
import { toActiveCallContent } from '../../../../../features/calls/scripts/toActiveCallContent';
import { useCallsStore } from '../../../../../features/calls/store/calls';
import { useCallBridgePopupStore } from '../store/callBridgePopup';

const { t } = useI18n();
const callsStore = useCallsStore();
const callBridgePopupStore = useCallBridgePopupStore();

const selectedCallId = ref<string | null>(null);
const isSubmitting = ref(false);

/**
 * @author Oleksandr Palonnyi
 * the calls the agent can connect the opened one to: every other Active call.
 * Which pair AC_14.02.07 means when there are more than two calls is not
 * specified, so the agent picks the second one from here
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const bridgeTargets = computed(() =>
	callsStore.activeCalls
		.filter((call) => call.id !== callBridgePopupStore.bridgeCallId)
		.map((call) => ({
			id: call.id,
			...toActiveCallContent(call),
		})),
);

async function connect(): Promise<void> {
	const { bridgeCallId } = callBridgePopupStore;
	if (
		isSubmitting.value ||
		bridgeCallId === null ||
		selectedCallId.value === null
	) {
		return;
	}

	isSubmitting.value = true;
	try {
		const areCallsConnected = await callsStore.bridgeCalls(
			bridgeCallId,
			selectedCallId.value,
		);
		if (areCallsConnected) callBridgePopupStore.close();
	} finally {
		isSubmitting.value = false;
	}
}

const isBridgedCallActive = computed(() =>
	isActiveCall(callsStore.getCallById(callBridgePopupStore.bridgeCallId ?? '')),
);

/**
 * @author Oleksandr Palonnyi
 * a call that ends while the popup is open has nothing left to connect
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
watch(
	isBridgedCallActive,
	(isActive) => {
		if (!isActive) callBridgePopupStore.close();
	},
	{
		immediate: true,
	},
);

/**
 * @author Oleksandr Palonnyi
 * the picked call can end too, and a selection that is no longer listed would
 * keep Connect enabled for a call that is gone
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
watch(bridgeTargets, (targets) => {
	if (!targets.some(({ id }) => id === selectedCallId.value)) {
		selectedCallId.value = null;
	}
});
</script>

<style scoped>
.bridge-popup__description {
	margin: 0 0 var(--spacing-xs);
}

.bridge-popup__calls {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	margin: 0;
	padding: 0;
	list-style: none;
}

.bridge-popup__call {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	box-sizing: border-box;
	width: 100%;
	padding: var(--spacing-xs);
	border: 1px solid transparent;
	border-radius: var(--border-radius);
	background: transparent;
	color: var(--text-main-color);
	text-align: left;
	cursor: pointer;
}

.bridge-popup__call--selected {
	border-color: var(--primary-color);
}

.bridge-popup__call-identity {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.bridge-popup__call-name,
.bridge-popup__call-number {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
