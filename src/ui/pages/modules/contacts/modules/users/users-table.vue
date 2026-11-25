<template>
	<div
		v-show="dataList.length"
		class="users-table table-wrapper"
	>
		<wt-table
			:data="dataList"
			:headers="shownHeaders"
			:lazy="true"
			:selectable="false"
			:on-loading="onLoading"
			:grid-actions="false"
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
					:name="item.name"
					clickable
					@click="openContact(item)"
				/>
			</template>

			<template #status="{ item }">
				<wt-indicator v-bind="getStatus(item)" />
			</template>

			<template #team="{ item }">
				{{ item.team?.name }}
			</template>

			<template #extension="{ item }">
				<contact-phones-cell :phones="getExtensionPhones(item)" />
			</template>
		</wt-table>
	</div>
</template>

<script setup lang="ts">
import type {
	ApiUser,
	ContactsPhoneNumber,
} from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { UserStatusColorMappings } from '../../../../../../features/user-status/enums/UserStatusColorMappings';
import { getUserStatusByPriority } from '../../../../../../features/user-status/scripts/getUserStatusByPriority';
import { useSidebarSelectionStore } from '../../../../../sidebar/store/sidebar-selection';
import UsernameTableCell from '../../../../components/username-table-cell.vue';
import ContactPhonesCell from '../contacts/components/contact-phones-cell.vue';
import type { useUsersDataListStore } from './store/users';

const props = defineProps<{
	store: ReturnType<typeof useUsersDataListStore>;
}>();

const {
	initialize,
	appendToDataList,
	updateSort,
	columnResize,
	columnReorder,
} = props.store;
const { dataList, shownHeaders, next, isLoading } = storeToRefs(props.store);

const { selectContactOrUnknown } = useSidebarSelectionStore();

/**
 * @author Polina Sukhorukova
 * A user has a single extension, so it is wrapped into the phones shape to
 * reuse the contacts phones cell: same call button and "no phone" fallback
 * [WS-30](https://webitel.atlassian.net/browse/WS-30)
 */
function getExtensionPhones({ extension }: ApiUser): ContactsPhoneNumber[] {
	return extension
		? [
				{
					number: extension,
				},
			]
		: [];
}

const isInitializing = ref(true);

const onLoading = async () => {
	if (isInitializing.value || isLoading.value || !next.value) return;
	await appendToDataList();
};

function openContact({ contact }: ApiUser) {
	selectContactOrUnknown(contact?.id);
}

function getStatus(item: ApiUser) {
	const status = getUserStatusByPriority({
		presence: item.presence,
	});

	return {
		color: UserStatusColorMappings[status],
		text: status.toUpperCase(),
	};
}

initialize().finally(() => {
	isInitializing.value = false;
});
</script>

<style scoped>
.users-table {
	width: 100%;
}
</style>
