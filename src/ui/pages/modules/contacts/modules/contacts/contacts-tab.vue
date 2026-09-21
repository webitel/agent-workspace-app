<template>
	<ws-table
		:data-list="dataList"
		:headers="shownHeaders"
		:next="next"
		:initialize="initialize"
		:append-to-data-list="appendToDataList"
	>
		<template #name="{ item }">
			<div class="contacts-tab__username">
				<wt-avatar
					size="xs"
					:username="item.name?.commonName"
				/>

				{{ item.name?.commonName }}
			</div>
		</template>

		<template #groups="{ item }">
			<table-cell-info
				:items="getGroupItems(item)"
			/>
		</template>

		<template #phones="{ item }">
			<table-cell-info
				icon="call--filled"
				:icon-color="IconColor.SUCCESS"
				:items="item.phones?.data"
				item-label="number"
			/>
		</template>

		<template #about="{ item }">
			{{ item.about }}
		</template>
	</ws-table>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { IconColor } from '@webitel/ui-sdk/enums';
import { storeToRefs } from 'pinia';
import TableCellInfo from '../../../../../components/table-cell-info.vue';
import WsTable from '../../../../components/ws-table.vue';
import type { useContactsDataListStore } from './store/contacts';

const props = defineProps<{
	store: ReturnType<typeof useContactsDataListStore>;
}>();

const { initialize, appendToDataList } = props.store;
const { dataList, shownHeaders, next } = storeToRefs(props.store);

function getGroupItems(item: WebitelContactsContact) {
	return item.groups?.data?.map(({ group }) => group).filter(Boolean) ?? [];
}
</script>

<style scoped>
.contacts-tab__username {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
