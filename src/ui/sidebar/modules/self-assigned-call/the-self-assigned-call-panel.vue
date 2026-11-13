<template>
	<div class="self-assigned-call-panel">
		<sidebar-section-header :title="title" />
		<contact-card
			v-if="contactId"
			:contact-id="contactId"
		/>
		<contact-panel-empty
			v-else-if="!phoneNumberSelection"
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
import { useContactIdentificationByNumber } from '../../components/contact/composables/useContactIdentificationByNumber';
import ContactCard from '../../components/contact/contact-card.vue';
import ContactCardUnknown from '../../components/contact/contact-card-unknown.vue';
import ContactIdentification from '../../components/contact/contact-identification.vue';
import ContactPanelEmpty from '../../components/contact/contact-panel-empty.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';
import { SidebarSelectionType } from '../../enums/SidebarSelectionType.enum';
import { useSidebarSelectionStore } from '../../store/sidebar-selection';

const { t } = useI18n();

const { selection, contactId } = storeToRefs(useSidebarSelectionStore());

const phoneNumberSelection = computed(() =>
	selection.value?.type === SidebarSelectionType.PhoneNumber
		? selection.value
		: null,
);

/**
 * A self-assigned call is not the agent's until they intercept it: the linked
 * contact is shown, otherwise the contacts are searched by the call's number
 * as a ringing call's are. None found (or contacts hidden) is an unknown
 * contact; several are shown one at a time, with no SELECT, as there is no
 * call of the agent's to link one to (ADR-0013, ADR-0015)
 * [WS-39](https://webitel.atlassian.net/browse/WS-39)
 */
const { contactIds, isLoading } = useContactIdentificationByNumber(
	() => phoneNumberSelection.value?.phoneNumber,
);

const isSingleContactShown = computed(
	() =>
		Boolean(contactId.value) ||
		(Boolean(phoneNumberSelection.value) &&
			!isLoading.value &&
			contactIds.value.length === 1),
);

const title = computed(() =>
	isSingleContactShown.value
		? t('ui.sidebar.contact.profile')
		: t('objects.contact', 2),
);
</script>

<style scoped>
.self-assigned-call-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
