<template>
	<page-wrapper :tabs="tabs">
		<template #actions-panel>
			<contacts-page-action-panel
				v-if="currentTab?.store"
				:key="currentTab.value"
				:store="currentTab.store"
			/>
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
import ContactsPageActionPanel from './contacts-page-action-panel.vue';
import { ContactsPageTab } from './enums/ContactsPageTab.enum';
import ContactsTable from './modules/contacts/contacts-table.vue';
import { useContactsDataListStore } from './modules/contacts/store/contacts';
import { useUsersDataListStore } from './modules/users/store/users';
import UsersTable from './modules/users/users-table.vue';

type ContactsPageStore =
	| ReturnType<typeof useContactsDataListStore>
	| ReturnType<typeof useUsersDataListStore>;

const { t } = useI18n();
const route = useRoute();

const tabs = computed<PageTab<ContactsPageStore>[]>(() => [
	{
		text: t('objects.contact', 2),
		value: ContactsPageTab.Contacts,
		pathName: ContactsPageTab.Contacts,
		component: ContactsTable,
		store: useContactsDataListStore(),
	},
	{
		text: t('objects.user', 2),
		value: ContactsPageTab.Users,
		pathName: ContactsPageTab.Users,
		component: UsersTable,
		store: useUsersDataListStore(),
	},
]);

const currentTab = computed(() =>
	tabs.value.find((tab) => tab.pathName === route.name),
);
</script>
