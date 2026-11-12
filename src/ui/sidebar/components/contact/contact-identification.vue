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
			:contact-id="contactIds[0]"
		/>
		<div
			v-else
			class="contact-identification__multiple"
		>
			<found-contacts-navigator
				:position="shownIndex + 1"
				:count="contactIds.length"
				@prev="showPrev"
				@next="showNext"
			/>
			<contact-card :contact-id="shownContactId" />
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
				@click="emit('select', shownContactId)"
			>
				{{ t('ui.reusable.select') }}
			</wt-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { ButtonColor } from '@webitel/ui-sdk/enums';
import emptyFiltersDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-dark.svg';
import emptyFiltersLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-light.svg';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemedImage } from '../../../../app/composables/useThemedImage';
import { ContactSearchMode } from '../../../../features/calls/modules/contact/enums/ContactSearchMode.enum';
import ContactCard from './contact-card.vue';
import ContactCardUnknown from './contact-card-unknown.vue';
import ContactPanelEmpty from './contact-panel-empty.vue';
import ContactSearch from './contact-search.vue';
import { ContactIdentificationMode } from './enums/ContactIdentificationMode.enum';
import FoundContactsNavigator from './found-contacts-navigator.vue';

const props = defineProps<{
	contactIds: string[];
	isLoading?: boolean;
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
	 * whether contactIds is the agent's search result rather than the identified contacts; an empty one then reads "no results" and Cancel shows
	 * [WS-76](https://webitel.atlassian.net/browse/WS-76)
	 */
	isSearchActive?: boolean;
}>();

const emit = defineEmits<{
	select: [
		contactId: string,
	];
	search: [
		payload: {
			query: string;
			searchMode: ContactSearchMode;
		},
	];
	cancelSearch: [];
}>();

const noResultsImage = useThemedImage({
	light: emptyFiltersLight,
	dark: emptyFiltersDark,
});

const searchQuery = ref('');
const searchMode = ref<ContactSearchMode>(ContactSearchMode.Name);

watch(
	() => props.isSearchActive,
	(isSearchActive) => {
		if (!isSearchActive) searchQuery.value = '';
	},
);

const { t } = useI18n();

const identificationMode = computed<ContactIdentificationMode>(() => {
	if (props.isLoading) return ContactIdentificationMode.Loading;
	if (!props.contactIds.length) return ContactIdentificationMode.NotFound;
	if (props.contactIds.length === 1) return ContactIdentificationMode.Single;
	return ContactIdentificationMode.Multiple;
});

const isSelectShown = computed(
	() =>
		props.canSelect &&
		identificationMode.value === ContactIdentificationMode.Multiple,
);

const shownIndex = ref(0);

const shownContactId = computed(() => props.contactIds[shownIndex.value]);

// a new result starts from its first contact
watch(
	() => props.contactIds,
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
