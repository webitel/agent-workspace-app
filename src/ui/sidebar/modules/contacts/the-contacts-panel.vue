<template>
	<div class="contacts-panel">
		<sidebar-section-header :title="title" />
		<contact-create-form
			v-if="isCreateFormOpen"
			:is-saving="isSaving"
			@submit="saveContact"
			@cancel="closeCreateForm"
		/>
		<contact-card
			v-else-if="contactId"
			:contact-id="contactId"
		/>
		<contact-card-unknown v-else-if="isUnknownSelected" />
		<contact-panel-empty
			v-else
			:title="t('ui.sidebar.contact.selectOrCreateContact.title')"
			:text="t('ui.sidebar.contact.selectOrCreateContact.text')"
		>
			<template #actions>
				<wt-button @click="openCreateForm">
					{{ t('ui.sidebar.contact.createContact') }}
				</wt-button>
			</template>
		</contact-panel-empty>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ContactsPageTab } from '../../../pages/modules/contacts/enums/ContactsPageTab.enum';
import { useContactsDataListStore } from '../../../pages/modules/contacts/modules/contacts/store/contacts';
import { useContactCreation } from '../../components/contact/composables/useContactCreation';
import ContactCard from '../../components/contact/contact-card.vue';
import ContactCardUnknown from '../../components/contact/contact-card-unknown.vue';
import type { NewContactDraft } from '../../components/contact/contact-create-form.types';
import ContactCreateForm from '../../components/contact/contact-create-form.vue';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import { useSidebarSelectionStore } from '../../store/sidebar-selection';

const { t } = useI18n();
const route = useRoute();

const sidebarSelectionStore = useSidebarSelectionStore();
const { selection, contactId, isUnknownSelected } = storeToRefs(
	sidebarSelectionStore,
);

const contactsListStore = useContactsDataListStore();

const { isSaving, createContact } = useContactCreation();

const isCreateFormOpen = ref(false);

const title = computed(() => {
	if (isCreateFormOpen.value) return t('ui.sidebar.contact.addContacts');
	if (contactId.value) return t('ui.sidebar.contact.profile');
	return t('objects.contact', 2);
});

function openCreateForm() {
	isCreateFormOpen.value = true;
}

function closeCreateForm() {
	isCreateFormOpen.value = false;
}

/**
 * @author Oleksandr Palonnyi
 * The panel goes with its page, and the form with a newly picked row: a save
 * that answers after either leaves the agent's selection and the closed panel
 * as they are, since selecting the contact would reopen the panel elsewhere
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
let isPanelUnmounted = false;
onUnmounted(() => {
	isPanelUnmounted = true;
});

/**
 * @author Oleksandr Palonnyi
 * The new contact is shown as if its row had been picked, and the Contacts
 * tab's list is read again from its first page so that it includes the new
 * contact. The Users tab lists users, not contacts, and the Contacts list is
 * read afresh when its tab opens, so nothing is reloaded there
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
async function saveContact(draft: NewContactDraft) {
	const createdContactId = await createContact(draft);
	if (!createdContactId || isPanelUnmounted || !isCreateFormOpen.value) return;

	sidebarSelectionStore.selectContact(createdContactId);

	if (route.name !== ContactsPageTab.Contacts) return;
	contactsListStore.updatePage(1);
	try {
		await contactsListStore.loadDataList();
	} catch {
		/**
		 * @author Oleksandr Palonnyi
		 * api-services has notified the agent and the table keeps the error; the contact is created and shown either way
		 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
		 */
	}
}

// Any new selection (a contact or an unknown one) replaces the create form
watch(selection, (value) => {
	if (value) closeCreateForm();
});
</script>

<style scoped>
.contacts-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
