<template>
	<section class="chat-info">
		<wt-message
			v-if="chatSession.variablesError"
			class="chat-info__error"
			color="error"
		>
			<span class="chat-info__error-text">
				{{ t('ui.pages.chats.info.loadError') }}
			</span>
			<wt-button
				:loading="chatSession.isVariablesLoading"
				color="secondary"
				size="sm"
				variant="text"
				@click="chatSession.refreshVariables()"
			>
				{{ t('reusable.retry') }}
			</wt-button>
		</wt-message>

		<!-- nothing to show yet: the task's variables would already be here -->
		<wt-loader v-if="!chatSession.variablesLoaded && !rows.length" />

		<wt-table
			v-else-if="rows.length"
			:data="sortedRows"
			:headers="headers"
			:selectable="false"
			:grid-actions="false"
			sortable
			data-key="id"
			@sort="handleSort"
		>
			<!-- Figma draws the arrow on both headers from the start, muted until
			     that column is the sorted one; WtTable only draws it once sorted -->
			<template
				v-for="field in ['key', 'value']"
				:key="field"
				#[`header-${field}`]="{ header }"
			>
				<div class="wt-table__th__content typo-body-1-bold">
					<span class="wt-table__th__title">{{ header.text }}</span>
					<wt-icon
						:class="{ 'chat-info__sort-arrow--idle': !header.sort }"
						:icon="header.sort === 'desc' ? 'sort-arrow-down' : 'sort-arrow-up'"
						size="sm"
					/>
				</div>
			</template>
			<template #key="{ item }">
				<span class="chat-info__cell chat-info__cell--key typo-body-1-bold">
					{{ item.key }}
				</span>
			</template>
			<template #value="{ item }">
				<span class="chat-info__cell">{{ item.value }}</span>
			</template>
		</wt-table>

		<!-- a failed first request has its own message above; no "empty" on top -->
		<wt-empty
			v-else-if="!chatSession.variablesError"
			:text="t('ui.pages.chats.info.empty')"
			size="sm"
		/>
	</section>
</template>

<script setup lang="ts">
import {
	WtButton,
	WtEmpty,
	WtIcon,
	WtLoader,
	WtMessage,
	WtTable,
} from '@webitel/ui-sdk/components';
import type { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import { SortSymbols } from '@webitel/ui-sdk/scripts';
import { computed, onActivated, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Task } from 'webitel-sdk';

import { type InfoSort, sortInfoRows } from '../../scripts/sortInfoRows';
import { toInfoRows } from '../../scripts/toInfoRows';
import { useChatSessionStore } from '../../store/chat-session';

const props = defineProps<{
	/** the chat's call-center task; absent once the task has left the feed */
	task?: Task;
	threadId: string;
}>();

const { t } = useI18n();

// Resolved reactively: the chat window reuses this instance across chats.
const chatSession = computed(() => useChatSessionStore(props.threadId));

const rows = computed(() =>
	toInfoRows({
		taskVariables: props.task?.variables,
		threadVariables: chatSession.value.variables,
	}),
);

const sort = ref<InfoSort | null>(null);
const sortedRows = computed(() => sortInfoRows(rows.value, sort.value));

// One sort must not follow the agent into another chat.
watch(
	() => props.threadId,
	() => {
		sort.value = null;
	},
);

const sortOf = (field: InfoSort['field']) =>
	sort.value?.field === field ? sort.value.order : SortSymbols.NONE;

const headers = computed<WtTableHeader[]>(() => [
	{
		value: 'key',
		field: 'key',
		locale: [
			'vocabulary.keys',
			1,
		],
		sort: sortOf('key'),
	},
	{
		value: 'value',
		field: 'value',
		locale: [
			'vocabulary.values',
			1,
		],
		sort: sortOf('value'),
	},
]);

function handleSort(
	header: WtTableHeader,
	order: InfoSort['order'] | typeof SortSymbols.NONE,
) {
	sort.value =
		order === SortSymbols.NONE
			? null
			: {
					field: header.field as InfoSort['field'],
					order,
				};
}

// The window keeps this panel alive between tab switches, so a mount hook would
// run once; the thread's variables can change meanwhile, so re-read on every
// return to the tab.
onActivated(() => chatSession.value.refreshVariables());
</script>

<style scoped>
.chat-info {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}

.chat-info__error {
	margin-bottom: var(--spacing-xs);
}

.chat-info__cell {
	overflow-wrap: anywhere;
}

.chat-info__sort-arrow--idle {
	color: var(--text-disabled-color);
}

.chat-info :deep(.p-datatable-thead > tr > th:first-child) {
	border-top-left-radius: var(--border-radius);
}

.chat-info :deep(.p-datatable-thead > tr > th:last-child) {
	border-top-right-radius: var(--border-radius);
}
</style>
