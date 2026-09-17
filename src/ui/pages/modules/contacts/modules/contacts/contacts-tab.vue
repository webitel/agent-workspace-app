<template>
	<div
		v-show="dataList.length"
		class="contacts-tab table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:selected="selected"
			:lazy="true"
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

			<template #user="{ item }">
				<wt-icon
					v-if="item.user"
					icon="webitel-logo"
				/>
			</template>

			<template #groups="{ item }">
				<table-cell-info
					icon="group"
					:items="getGroupItems(item)"
				/>
			</template>

			<template #phones="{ item }">
				<table-cell-info
					icon="call"
					icon-color="success"
					:items="item.phones?.data"
					item-label="number"
				/>
			</template>

			<template #managers="{ item }">
				<table-cell-info
					icon="user"
					:items="getManagerItems(item)"
				/>
			</template>

			<template #about="{ item }">
				{{ item.about }}
			</template>

			<template #labels="{ item }">
				<div v-if="item.labels?.data">
					<wt-chip
						v-for="{ label, id } of item.labels.data"
						:key="id"
					>
						{{ label }}
					</wt-chip>
				</div>
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
const { dataList, selected, shownHeaders, next } = storeToRefs(tableStore);

const isFirstLoad = ref(false);

const onLoading = async () => {
	if (!next.value && isFirstLoad.value) return;
	await appendToDataList();
	isFirstLoad.value = true;
};

function getGroupItems(item: WebitelContactsContact) {
	return item.groups?.data?.map(({ group }) => group).filter(Boolean) ?? [];
}

function getManagerItems(item: WebitelContactsContact) {
	return item.managers?.data?.map(({ user }) => user).filter(Boolean) ?? [];
}

initialize();
</script>

<style scoped>
.contacts-tab {
	width: 100%;
}

.contacts-tab__username {
	display: flex;
	align-items: center;
}
</style>
