<template>
	<div class="contact-search">
		<p class="contact-search__title typo-body-2-bold">
			{{ t('ui.sidebar.contact.search.title') }}
		</p>
		<wt-search-bar
			:value="query"
			:search-mode="searchMode"
			:search-mode-options="modeOptions"
			full-width
			@input="query = $event"
			@search="emit('search', { query: $event, searchMode })"
			@update:search-mode="onModeChange"
		/>
	</div>
</template>

<script setup lang="ts">
import { WtSearchBar } from '@webitel/ui-sdk/components';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ContactSearchMode } from '../../../../features/calls/modules/contact/enums/ContactSearchMode.enum';

const emit = defineEmits<{
	search: [
		payload: {
			query: string;
			searchMode: ContactSearchMode;
		},
	];
}>();

const query = defineModel<string>('query', {
	default: '',
});

const searchMode = defineModel<ContactSearchMode>('searchMode', {
	default: ContactSearchMode.Name,
});

const { t } = useI18n();

const modeOptions = computed(() =>
	Object.values(ContactSearchMode).map((value) => ({
		value,
		text: t(`ui.sidebar.contact.search.modes.${value}`),
	})),
);

function onModeChange(option: { value: ContactSearchMode }) {
	searchMode.value = option.value;
	if (query.value.trim())
		emit('search', {
			query: query.value,
			searchMode: searchMode.value,
		});
}
</script>

<style scoped>
.contact-search {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-search__title {
	margin: 0;
}
</style>
