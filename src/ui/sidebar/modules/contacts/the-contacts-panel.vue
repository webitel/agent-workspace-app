<template>
	<div class="contacts-panel">
		<sidebar-section-header :title="title" />
		<contact-create-form
			v-if="isCreateFormOpen"
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
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactCard from '../../components/contact/contact-card.vue';
import ContactCardUnknown from '../../components/contact/contact-card-unknown.vue';
import ContactCreateForm from '../../components/contact/contact-create-form.vue';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import { useSidebarSelectionStore } from '../../store/sidebar-selection';

const { t } = useI18n();

const { selection, contactId, isUnknownSelected } = storeToRefs(
	useSidebarSelectionStore(),
);

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
