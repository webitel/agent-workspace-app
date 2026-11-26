<template>
	<div class="contact-identification">
		<contact-search
			v-if="canSearch"
			v-model:query="searchQuery"
			v-model:search-mode="searchMode"
			@search="emit('search', $event)"
		/>
		<wt-loader v-if="identificationMode === ContactIdentificationMode.Loading" />
		<template v-else-if="identificationMode === ContactIdentificationMode.NotFound">
			<contact-panel-empty
				v-if="isSearchActive"
				:image="noResultsImage"
				:title="t('ui.sidebar.contact.search.noResults')"
				text=""
			/>
			<contact-card-unknown v-else />
		</template>
		<contact-card
			v-else-if="identificationMode === ContactIdentificationMode.Single"
			:contact="contacts[0]"
			@changed="emitChanged(contacts[0])"
		/>
		<!-- a linked contact that failed to load shows nothing in its place (WS-186) -->
		<div
			v-else-if="identificationMode === ContactIdentificationMode.Multiple"
			class="contact-identification__multiple"
		>
			<found-contacts-navigator
				:position="shownIndex + 1"
				:count="contacts.length"
				@prev="showPrev"
				@next="showNext"
			/>
			<!-- the found contacts come with every field the card shows: switching loads nothing (WS-186) -->
			<contact-card
				:contact="shownContact"
				@changed="emitChanged(shownContact)"
			/>
		</div>
		<!-- the parent's own actions (e.g. CREATE) share one row with SELECT -->
		<div
			v-if="identificationMode !== ContactIdentificationMode.Loading"
			class="contact-identification__actions"
		>
			<slot name="actions" />
			<wt-button
				v-if="isSearchActive"
				:color="ButtonColor.SECONDARY"
				@click="emit('cancelSearch')"
			>
				{{ t('reusable.cancel') }}
			</wt-button>
			<wt-button
				v-if="isSelectShown"
				:color="ButtonColor.SUCCESS"
				@click="emit('select', shownContact)"
			>
				{{ t('ui.reusable.select') }}
			</wt-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ContactsSearchMode } from '@webitel/api-services/api';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { WtButton } from '@webitel/ui-sdk/components';
import { ButtonColor } from '@webitel/ui-sdk/enums';
import emptyFiltersDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-dark.svg';
import emptyFiltersLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-light.svg';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemedImage } from '../../../../app/composables/useThemedImage';
import ContactCard from './contact-card.vue';
import ContactCardUnknown from './contact-card-unknown.vue';
import ContactPanelEmpty from './contact-panel-empty.vue';
import type { ContactSearchMode } from './contact-search.types';
import ContactSearch from './contact-search.vue';
import { ContactIdentificationMode } from './enums/ContactIdentificationMode.enum';
import FoundContactsNavigator from './found-contacts-navigator.vue';

const props = defineProps<{
	contacts: WebitelContactsContact[];
	isLoading?: boolean;
	/**
	 * the call is linked to a contact that failed to load: no contact is shown,
	 * yet it is not the Unknown contact
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	isLinkedContactUnavailable?: boolean;
	// whether the shown contact can be chosen; the block itself links nothing
	canSelect?: boolean;
	/**
	 * @author Oleksandr Palonnyi
	 * whether the search field is offered; the parent decides, since only an open call can search
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	canSearch?: boolean;
	/**
	 * @author Oleksandr Palonnyi
	 * whether contacts is the agent's search result rather than the identified contacts; an empty one then reads "no results" and Cancel shows
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	isSearchActive?: boolean;
}>();

const emit = defineEmits<{
	select: [
		contact: WebitelContactsContact,
	];
	search: [
		payload: {
			query: string;
			searchMode: ContactSearchMode;
		},
	];
	cancelSearch: [];
	/**
	 * the card added a phone or an email to this contact: the parent, which
	 * holds the contacts, reloads it
	 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
	 */
	changed: [
		contactId: string,
	];
}>();

function emitChanged(contact: WebitelContactsContact | undefined) {
	if (contact?.id) emit('changed', contact.id);
}

const noResultsImage = useThemedImage({
	light: emptyFiltersLight,
	dark: emptyFiltersDark,
});

const searchQuery = ref('');
const searchMode = ref<ContactSearchMode>(ContactsSearchMode.NAME);

watch(
	() => props.isSearchActive,
	(isSearchActive) => {
		if (!isSearchActive) searchQuery.value = '';
	},
);

const { t } = useI18n();

const identificationMode = computed<ContactIdentificationMode>(() => {
	if (props.isLoading) return ContactIdentificationMode.Loading;
	if (props.isLinkedContactUnavailable)
		return ContactIdentificationMode.LinkedContactUnavailable;
	if (!props.contacts.length) return ContactIdentificationMode.NotFound;
	if (props.contacts.length === 1) return ContactIdentificationMode.Single;
	return ContactIdentificationMode.Multiple;
});

/**
 * @author Oleksandr Palonnyi
 * a lone identified contact is already linked by the parent, so SELECT is for several of them; a lone search match is linked by nobody, so it gets SELECT too (BA)
 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
 */
const isSelectShown = computed(() => {
	if (!props.canSelect) return false;
	if (identificationMode.value === ContactIdentificationMode.Multiple)
		return true;
	return (
		identificationMode.value === ContactIdentificationMode.Single &&
		Boolean(props.isSearchActive)
	);
});

const shownIndex = ref(0);

const shownContact = computed(() => props.contacts[shownIndex.value]);

/**
 * A new result starts from its first contact. A contact reloaded in place
 * (after the card added a phone or an email) keeps the same ids, so the shown
 * one stays on screen
 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
 */
watch(
	() => props.contacts.map(({ id }) => id).join(),
	() => {
		shownIndex.value = 0;
	},
);

function showPrev() {
	shownIndex.value -= 1;
}

function showNext() {
	shownIndex.value += 1;
}
</script>

<style scoped>
.contact-identification {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-identification .wt-loader {
	margin: auto;
}

.contact-identification__multiple {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-identification__actions {
	display: flex;
	justify-content: center;
	gap: var(--spacing-xs);
}
</style>
