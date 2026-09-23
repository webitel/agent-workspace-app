<template>
	<page-wrapper :tabs="tabs">
		<template #actions-panel>
			<component :is="currentTab?.actionPanel" :store="currentTab?.store" />
		</template>
		<template #main>
			<component :is="currentTab?.component" :store="currentTab?.store" />
		</template>
	</page-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageWrapper from '../../components/page-wrapper.vue';
import type { PageTab } from '../../types/PageTab.types';
import { ContactsPageTab } from './enums/ContactsPageTab.enum';
import ContactsActionPanel from './modules/contacts/contacts-action-panel.vue';
import ContactsTable from './modules/contacts/contacts-table.vue';
import { useContactsDataListStore } from './modules/contacts/store/contacts';
import UsersTable from './modules/users/users-table.vue';

const { t } = useI18n();
const route = useRoute();

const tabs = computed<PageTab<ReturnType<typeof useContactsDataListStore>>[]>(
	() => [
		{
			text: t('objects.contact', 2),
			value: ContactsPageTab.Contacts,
			pathName: ContactsPageTab.Contacts,
			component: ContactsTable,
			actionPanel: ContactsActionPanel,
			store: useContactsDataListStore(),
		},
		{
			text: t('objects.user', 2),
			value: ContactsPageTab.Users,
			pathName: ContactsPageTab.Users,
			component: UsersTable,
		},
	],
);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);
</script>
