<template>
	<div class="call-panel">
		<call-info-panel :content="content" />
		<template v-if="isCreateFormOpen">
			<sidebar-section-header :title="t('ui.sidebar.contact.addContacts')" />
			<contact-create-form
				:is-saving="isCreateFormSaving"
				@submit="saveContact"
				@cancel="closeCreateForm"
			/>
		</template>
		<template v-else-if="!isContactHidden">
			<contact-identification
				:contacts="contacts"
				:is-loading="isLoading"
				:is-linked-contact-unavailable="isLinkedContactUnavailable"
				:can-select="isCallActive"
				:can-search="isCallActive"
				:is-search-active="isSearchActive"
				@select="selectContact"
				@changed="reloadContact"
				@search="search"
				@cancel-search="cancelSearch"
			>
				<template #actions>
					<wt-button
						v-if="isCallActive"
						@click="openCreateForm"
					>
						{{ t('reusable.create') }}
					</wt-button>
				</template>
			</contact-identification>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ContactsAPI } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { WtButton } from '@webitel/ui-sdk/components';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type Call, CallActions } from 'webitel-sdk';
import { useCallContact } from '../../../../features/calls/modules/contact/composables/useCallContact';
import CallInfoPanel from '../../../../features/calls/modules/info/components/call-info-panel/call-info-panel.vue';
import { toCallInfoPanelContent } from '../../../../features/calls/modules/info/scripts/toCallInfoPanelContent';
import { useContactCreation } from '../../components/contact/composables/useContactCreation';
import type { NewContactDraft } from '../../components/contact/contact-create-form.types';
import ContactCreateForm from '../../components/contact/contact-create-form.vue';
import ContactIdentification from '../../components/contact/contact-identification.vue';
import SidebarSectionHeader from '../../components/sidebar-section-header.vue';

// The call open on the page; the sidebar shows this panel only while it exists.
const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();

const content = computed(() => toCallInfoPanelContent(props.call));

const {
	contacts,
	isLoading,
	isContactHidden,
	isLinkedContactUnavailable,
	isSearchActive,
	selectContact,
	reloadContact,
	search,
	cancelSearch,
} = useCallContact(() => props.call);

const { isSaving, createContact } = useContactCreation();

/**
 * @author Oleksandr Palonnyi
 * The form stays, saving, until the created contact is linked: closed earlier,
 * it would show the old Unknown card with CREATE for the length of the socket
 * round trip, an invitation to create the contact twice
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
const isLinking = ref(false);
const isCreateFormSaving = computed(() => isSaving.value || isLinking.value);

// contacts are created and linked only while the call is live, as in
// cc-workspaces: not while ringing, nor after hangup
const isCallActive = computed(
	() =>
		props.call.state === CallActions.Active ||
		props.call.state === CallActions.Hold,
);

const isCreateFormOpen = ref(false);

function openCreateForm() {
	isCreateFormOpen.value = true;
}

function closeCreateForm() {
	isCreateFormOpen.value = false;
}

/**
 * @author Oleksandr Palonnyi
 * A contact created during the call is linked to it at once, through the same
 * link as SELECT (as cc-workspaces does, WTEL-10527), so the panel then shows
 * it as the linked contact. SELECT links a loaded contact, so the new one is
 * read by its id first. Only to the call it was created for: if the agent
 * has moved to another call or this one has hung up meanwhile, the contact is
 * created and left unlinked (ADR-0031)
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
async function saveContact(draft: NewContactDraft) {
	const callId = props.call.id;
	const createdContactId = await createContact(draft);
	if (!createdContactId) return;
	if (props.call.id !== callId || !isCallActive.value) return;

	isLinking.value = true;
	try {
		const createdContact: WebitelContactsContact = await ContactsAPI.get({
			itemId: createdContactId,
		});
		if (props.call.id !== callId || !isCallActive.value) return;
		await selectContact(createdContact);
	} catch {
		/**
		 * @author Oleksandr Palonnyi
		 * api-services has notified the agent; the contact is created and left unlinked, as a failed SELECT leaves it
		 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
		 */
	} finally {
		isLinking.value = false;
		if (props.call.id === callId) closeCreateForm();
	}
}

// a form left open must not carry over to another call
watch(() => props.call.id, closeCreateForm);

/**
 * @author Oleksandr Palonnyi
 * creating is offered only while the call is live, so a hangup closes a form left open
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
watch(isCallActive, (isActive) => {
	if (!isActive) closeCreateForm();
});
</script>

<style scoped>
.call-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
