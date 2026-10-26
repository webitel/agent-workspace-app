<template>
	<div class="contacts-sidebar-panel">
		<sidebar-section-header :title="title" />
		<contact-create-form
			v-if="screen === ContactsSidebarScreen.Create"
			@cancel="closeCreateForm"
		/>
		<contact-card
			v-else-if="screen === ContactsSidebarScreen.Contact && contactId"
			:contact-id="contactId"
		/>
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
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactCard from '../../components/contact/contact-card.vue';
import ContactCreateForm from '../../components/contact/contact-create-form.vue';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import { ContactsSidebarScreen } from './enums/ContactsSidebarScreen.enum';

const props = defineProps<{
	contactId?: string;
}>();

const { t } = useI18n();

const isCreateFormOpen = ref(false);

const screen = computed<ContactsSidebarScreen>(() => {
	if (isCreateFormOpen.value) return ContactsSidebarScreen.Create;
	if (props.contactId) return ContactsSidebarScreen.Contact;
	return ContactsSidebarScreen.Empty;
});

const titleByScreen: Record<ContactsSidebarScreen, () => string> = {
	[ContactsSidebarScreen.Empty]: () => t('objects.contact', 2),
	[ContactsSidebarScreen.Create]: () => t('ui.sidebar.contact.addContacts'),
	[ContactsSidebarScreen.Contact]: () => t('ui.sidebar.contact.profile'),
};

const title = computed(() => titleByScreen[screen.value]());

function openCreateForm() {
	isCreateFormOpen.value = true;
}

function closeCreateForm() {
	isCreateFormOpen.value = false;
}

watch(
	() => props.contactId,
	(contactId) => {
		if (contactId) closeCreateForm();
	},
);
</script>

<style scoped>
.contacts-sidebar-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
