<template>
	<div
		v-show="dataList.length"
		class="contacts-table table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
			:on-loading="onLoading"
			data-key="id"
			sortable
			resizable-columns
			reorderable-columns
			@sort="(column, order) => updateSort(column, order)"
			@column-resize="columnResize"
			@column-reorder="columnReorder"
		>
			<template #name="{ item }">
				<username-table-cell
					:name="item.name?.commonName"
					clickable
					@click="selectContact(item.id)"
				/>
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

			<template #emails="{ item }">
				<table-cell-info
					icon="ws-navigation-email"
					:icon-color="IconColor.MAIL"
					:items="item.emails?.data"
					item-label="email"
				/>
			</template>

			<template #imclients="{ item }">
				<table-cell-info
					icon="ws-chat"
					:icon-color="IconColor.CHAT"
					:items="getImclientItems(item)"
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
import { IconColor } from '@webitel/ui-sdk/enums';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import TableCellInfo from '../../../../components/table-cell-info.vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import type { useContactsDataListStore } from './store/contacts';

const props = defineProps<{
	store: ReturnType<typeof useContactsDataListStore>;
}>();

const {
	initialize,
	appendToDataList,
	updateSort,
	columnResize,
	columnReorder,
} = props.store;
const { dataList, shownHeaders, next } = storeToRefs(props.store);

const { selectContact } = useSidebarSelectionStore();

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

function getImclientItems(item: WebitelContactsContact) {
	return (
		item.imclients?.data
			?.map(({ id, user }) => ({
				id,
				name: user?.name,
			}))
			.filter(({ name }) => Boolean(name)) ?? []
	);
}

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.contacts-table {
	width: 100%;
}
</style>
