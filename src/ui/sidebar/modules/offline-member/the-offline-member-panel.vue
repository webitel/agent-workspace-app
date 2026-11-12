<template>
	<div class="offline-member-panel">
		<sidebar-section-header :title="title" />
		<contact-panel-empty
			v-if="!phoneNumberSelection"
			:title="t('ui.sidebar.contact.selectContact.title')"
			:text="t('ui.sidebar.contact.selectContact.text')"
		/>
		<contact-card-unknown v-else-if="!isLoading && !contactIds.length" />
		<contact-identification
			v-else
			:contact-ids="contactIds"
			:is-loading="isLoading"
		/>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactCardUnknown from '../../components/contact/contact-card-unknown.vue';
import ContactIdentification from '../../components/contact/contact-identification.vue';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import { SidebarSelectionType } from '../../enums/SidebarSelectionType.enum';
import { useSidebarSelectionStore } from '../../store/sidebar-selection';
import { useOfflineMemberContactIdentification } from './composables/useOfflineMemberContactIdentification';

const { t } = useI18n();

const { selection } = storeToRefs(useSidebarSelectionStore());

const phoneNumberSelection = computed(() =>
	selection.value?.type === SidebarSelectionType.PhoneNumber
		? selection.value
		: null,
);

/**
 * As the History panel, but the contact is not on the row: it is searched by
 * the member's number, as a call's is. None found (or contacts hidden) is an
 * unknown contact; several are shown one at a time, with no SELECT, as there
 * is no call yet to link one to (ADR-0013)
 * [WS-30](https://webitel.atlassian.net/browse/WS-30)
 */
const { contactIds, isLoading } = useOfflineMemberContactIdentification(
	() => phoneNumberSelection.value?.phoneNumber,
);

// a contact card is on screen, whether it is the only one found or one of several
const title = computed(() =>
	!isLoading.value && contactIds.value.length
		? t('ui.sidebar.contact.profile')
		: t('objects.contact', 2),
);
</script>

<style scoped>
.offline-member-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
