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
				<contact-phones-cell :phones="item.phones?.data" />
			</template>

			<template #emails="{ item }">
				<contact-emails-cell :emails="item.emails?.data" />
			</template>

			<template #imclients="{ item }">
				<contact-chats-cell :contact-clients="item.imclients?.data" />
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
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import TableCellInfo from '../../../../components/table-cell-info.vue';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import ContactChatsCell from './components/contact-chats-cell.vue';
import ContactEmailsCell from './components/contact-emails-cell.vue';
import ContactPhonesCell from './components/contact-phones-cell.vue';
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
const { dataList, shownHeaders, next, isLoading } = storeToRefs(props.store);

const { selectContact } = useSidebarSelectionStore();

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

function getGroupItems(item: WebitelContactsContact) {
	return item.groups?.data?.map(({ group }) => group).filter(Boolean) ?? [];
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
