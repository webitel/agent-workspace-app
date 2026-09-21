<template>
	<ws-page-wrapper :tabs="tabs">
		<template #actions-panel>
			<ws-table-action-panel
				:search="!!currentTab?.search"
				:search-value="searchValue"
				:headers="shownHeaders"
				:actions="currentTab?.actions ?? []"
				@update:search-value="searchValue = $event"
				@search="handleSearch"
				@refresh="refresh"
				@update:headers="updateShownHeaders"
			/>
		</template>
		<template #main>
			<component :is="currentTab?.component" :store="currentTab?.store" />
		</template>
	</ws-page-wrapper>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { Component } from 'vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { WsTableActionPanelAction } from '../../components/enums/WsTableActionPanelAction.enum';
import WsPageWrapper from '../../components/ws-page-wrapper.vue';
import WsTableActionPanel from '../../components/ws-table-action-panel.vue';
import { ContactsPageTabName } from './enums/ContactsPageTabName.enum';
import ContactsTab from './modules/contacts/contacts-tab.vue';
import { useContactsDataListStore } from './modules/contacts/store/contacts';
import UsersTab from './modules/users/users-tab.vue';

interface ContactsPageTab {
	text: string;
	value: string;
	pathName: ContactsPageTabName;
	component: Component;
	store?: ReturnType<typeof useContactsDataListStore>;
	actions: WsTableActionPanelAction[];
	search?: boolean;
}

const { t } = useI18n();
const route = useRoute();

// стор створюється один раз тут — і для action-панелі (нижче), і щоб
// явно віддати його в contacts-tab.vue через проп `store`
const contactsDataListStore = useContactsDataListStore();

const tabs = computed<ContactsPageTab[]>(() => [
	{
		text: t('objects.contact', 2),
		value: 'contacts',
		pathName: ContactsPageTabName.Contacts,
		component: ContactsTab,
		store: contactsDataListStore,
		actions: [],
		search: true,
	},
	{
		text: t('objects.user', 2),
		value: 'users',
		pathName: ContactsPageTabName.Users,
		component: UsersTab,
		actions: [],
		search: true,
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);

const { shownHeaders } = storeToRefs(contactsDataListStore);
const {
	hasFilter,
	addFilter,
	updateFilter,
	deleteFilter,
	updateShownHeaders,
	loadDataList,
} = contactsDataListStore;

const isContactsTab = computed(
	() => currentTab.value?.pathName === ContactsPageTabName.Contacts,
);

const searchValue = ref('');

const handleSearch = (value: string) => {
	if (!isContactsTab.value) return;

	if (!value) {
		if (hasFilter('search'))
			deleteFilter({
				name: 'search',
			});
		return;
	}

	hasFilter('search')
		? updateFilter({
				name: 'search',
				value,
			})
		: addFilter({
				name: 'search',
				value,
			});
};

const refresh = () => {
	if (!isContactsTab.value) return;
	loadDataList();
};
</script>
