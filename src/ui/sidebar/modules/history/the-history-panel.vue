<template>
	<div class="history-panel">
		<sidebar-section-header :title="title" />
		<contact-card
			v-if="mode === HistorySidebarMode.View && contactId"
			:contact-id="contactId"
		/>
		<contact-card-unknown v-else-if="mode === HistorySidebarMode.Unknown" />
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
import { SidebarSelectionType } from '../../enums/SidebarSelectionType.enum';
import { useSidebarSelectionStore } from '../../store/sidebar-selection';
import { HistorySidebarMode } from './enums/HistorySidebarMode.enum';

const { t } = useI18n();

const { selection, contactId } = storeToRefs(useSidebarSelectionStore());

const modeBySelectionType: Record<SidebarSelectionType, HistorySidebarMode> = {
	[SidebarSelectionType.Contact]: HistorySidebarMode.View,
	[SidebarSelectionType.Unknown]: HistorySidebarMode.Unknown,
};

const mode = computed<HistorySidebarMode>(() =>
	selection.value
		? modeBySelectionType[selection.value.type]
		: HistorySidebarMode.Empty,
);

const titleByMode: Record<HistorySidebarMode, () => string> = {
	[HistorySidebarMode.Empty]: () => t('objects.contact', 2),
	[HistorySidebarMode.View]: () => t('ui.sidebar.contact.profile'),
	[HistorySidebarMode.Unknown]: () => t('objects.contact', 2),
};

const title = computed(() => titleByMode[mode.value]());
</script>

<style scoped>
.history-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
