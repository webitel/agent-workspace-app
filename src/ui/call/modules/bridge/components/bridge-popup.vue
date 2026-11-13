<template>
	<wt-popup
		:size="ComponentSize.SM"
		:height="ComponentSize.SM"
		@close="callBridgePopupStore.close()"
	>
		<template #title>
			{{ t('ui.call.bridge.title') }}
		</template>

		<template #main>
			<wt-table
				class="bridge-popup__table"
				:data="bridgeTargets"
				:headers="BRIDGE_TABLE_HEADERS"
				:selectable="false"
				:grid-actions="false"
				data-key="id"
				headless
			>
				<template #name="{ item }">
					<username-table-cell :name="item.name" />
				</template>

				<template #connect="{ item }">
					<wt-button
						:color="ButtonColor.SUCCESS"
						:size="ComponentSize.SM"
						:disabled="isSubmitting"
						@click="connect(item.id)"
					>
						{{ t('ui.call.bridge.connect') }}
					</wt-button>
				</template>
			</wt-table>
		</template>

		<template #actions>
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
import type { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import { ButtonColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { isActiveCall } from '../../../../../features/calls/scripts/isActiveCall';
import { toActiveCallContent } from '../../../../../features/calls/scripts/toActiveCallContent';
import { useCallsStore } from '../../../../../features/calls/store/calls';
import UsernameTableCell from '../../../../pages/components/username-table-cell.vue';
import { useCallBridgePopupStore } from '../store/callBridgePopup';

const { t } = useI18n();
const callsStore = useCallsStore();
const callBridgePopupStore = useCallBridgePopupStore();

const BRIDGE_TABLE_HEADERS: WtTableHeader[] = [
	{
		value: 'name',
		show: true,
	},
	{
		value: 'number',
		show: true,
	},
	{
		value: 'connect',
		show: true,
		width: '86px',
	},
];

const isSubmitting = ref(false);

/**
 * @author Oleksandr Palonnyi
 * the calls the agent can connect the opened one to: every other Active call.
 * Which pair AC_14.02.07 means when there are more than two calls is not
 * specified, so the agent chooses the second one by its Connect button
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
const bridgeTargets = computed(() =>
	callsStore.activeCalls
		.filter((call) => call.id !== callBridgePopupStore.bridgeCallId)
		.map((call) => {
			const { name, number } = toActiveCallContent(call);

			return {
				id: call.id,
				name: name || t('ui.call.bridge.unknownContact'),
				number,
			};
		}),
);

async function connect(otherCallId: string): Promise<void> {
	const { bridgeCallId } = callBridgePopupStore;
	if (isSubmitting.value || bridgeCallId === null) return;

	isSubmitting.value = true;
	try {
		const areCallsConnected = await callsStore.bridgeCalls(
			bridgeCallId,
			otherCallId,
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
</script>

<style scoped>
.bridge-popup__table {
	height: 100%;
}
</style>
