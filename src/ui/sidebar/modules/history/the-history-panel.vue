<template>
	<div class="history-panel">
		<sidebar-section-header :title="title" />
		<contact-card
			v-if="contactId"
			:contact-id="contactId"
		/>
		<contact-card-unknown v-else-if="isUnknownSelected" />
		<contact-panel-empty
			v-else
			:title="t('ui.sidebar.contact.selectContact.title')"
			:text="t('ui.sidebar.contact.selectContact.text')"
		/>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactCard from '../../components/contact/contact-card.vue';
import ContactCardUnknown from '../../components/contact/contact-card-unknown.vue';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import { useSidebarSelectionStore } from '../../store/sidebar-selection';

const { t } = useI18n();

const { contactId, isUnknownSelected } = storeToRefs(
	useSidebarSelectionStore(),
);

const title = computed(() =>
	contactId.value ? t('ui.sidebar.contact.profile') : t('objects.contact', 2),
);
</script>

<style scoped>
.history-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
