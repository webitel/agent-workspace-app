<template>
	<section class="the-missed-calls">
		<header class="the-missed-calls__toolbar">
			<h2 class="typo-headline-6">
				{{ t('ui.pages.calls.missed.title') }}
			</h2>
      <!-- TODO SEARCH -->
			<div>search</div>
		</header>

		<wt-table
			class="the-missed-calls__table"
			:headers="store.headers"
			:data="store.rows"
			:loading="store.loading"
			:on-loading="store.loadMore"
			data-key="id"
			lazy
			reorderable-columns
			resizable-columns
			sortable
			@sort="store.applySort"
		>
			<template #name="{ item }">
				<div
					class="the-missed-calls__name-cell"
					@click="openContactCard(item)"
				>
					<wt-avatar
						:username="item.name"
						size="sm"
					/>
				</div>
			</template>

			<template #createdAt="{ item }">
				<wt-datetime-text :datetime="item.createdAt" />
			</template>

			<template #duration="{ item }">
				{{ convertDuration(item.duration) }}
			</template>

			<template #actions="{ item }">
				<wt-icon-btn
					v-tooltip="t('ui.pages.calls.missed.actions.openContact')"
					icon="arrow-right"
					@click="openContactCard(item)"
				/>

				<wt-icon-btn
					v-tooltip="t('ui.pages.calls.missed.actions.call')"
					icon="call"
					@click="store.redial(item.id)"
				/>
			</template>
		</wt-table>
	</section>
</template>

<script
	setup
	lang="ts"
>
import {
	WtAvatar,
	WtDatetimeText,
	WtIconBtn,
	WtTable,
} from '@webitel/ui-sdk/components';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMissedCallsStore } from '../store/missedCalls';
import type { MissedCallRow } from '../types/MissedCall.types';

const { t } = useI18n();
const store = useMissedCallsStore();

onMounted(() => {
	store.initialize();
});

function openContactCard(row: MissedCallRow) {
	console.warn(
		'[missed-calls] contact card (E7) is not implemented yet',
		row.contactId,
	);
}
</script>

<style scoped>
.the-missed-calls {
	display: flex;
	flex-direction: column;
	min-height: 0;
	height: 100%;
}

.the-missed-calls__toolbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--spacing-sm) var(--spacing-md);
}

.the-missed-calls__table {
	flex: 1;
	min-height: 0;
}

.the-missed-calls__name-cell {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	border: none;
	background: none;
	cursor: pointer;
	padding: 0;
	text-align: left;
}
</style>
