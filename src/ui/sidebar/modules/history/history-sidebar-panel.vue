<template>
	<div class="history-sidebar-panel">
		<sidebar-section-header
			icon="contact-book--filled"
			:icon-color="IconColor.JOB"
			:title="t('objects.contact', 2)"
		/>
		<contact-panel-empty
			:title="t('ui.sidebar.contact.selectContact.title')"
			:text="t('ui.sidebar.contact.selectContact.text')"
		/>
	</div>
</template>

<script setup lang="ts">
import { IconColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import ContactPanelEmpty from '../contact/components/contact-panel-empty.vue';

const { t } = useI18n();
</script>

<style scoped>
.history-sidebar-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>