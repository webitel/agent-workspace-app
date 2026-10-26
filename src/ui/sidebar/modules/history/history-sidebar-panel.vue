<template>
	<div class="history-sidebar-panel">
		<sidebar-section-header
			:title="t('objects.contact', 2)"
		/>
		<contact-panel-empty
			:title="t('ui.sidebar.contact.selectContact.title')"
			:text="t('ui.sidebar.contact.selectContact.text')"
		/>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';

const { t } = useI18n();
</script>

<style scoped>
.history-sidebar-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>