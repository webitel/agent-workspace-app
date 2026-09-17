<template>
	<div
		v-show="dataList.length"
		class="contacts-tab table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
      :selectable="false"
			:on-loading="onLoading"
			data-key="id"
			sortable
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
					icon-color="success"
					:items="item.phones?.data"
					item-label="number"
				/>
			</template>

			<template #about="{ item }">
				{{ item.about }}
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import TableCellInfo from '../../../../../components/table-cell-info.vue';
import { useContactsDataListStore } from './store/contacts';

const tableStore = useContactsDataListStore();
const { initialize, appendToDataList } = tableStore;
const { dataList, shownHeaders, next } = storeToRefs(tableStore);

const isFirstLoad = ref(false);
const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value) return;
	if (!next.value && isFirstLoad.value) return;
	await appendToDataList();
	isFirstLoad.value = true;
};

function getGroupItems(item: WebitelContactsContact) {
	return item.groups?.data?.map(({ group }) => group).filter(Boolean) ?? [];
}

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.contacts-tab {
	width: 100%;
}

.contacts-tab__username {
	display: flex;
	align-items: center;
  gap: var(--spacing-xs);
}
</style>
