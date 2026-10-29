<template>
	<div class="contact-card-info">
		<key-value-list
			:title="t('ui.sidebar.contact.info')"
			:items="infoItems"
		/>

		<wt-divider />

		<key-value-list
			class="contact-card-info__attributes"
			:title="t('ui.sidebar.contact.attributes')"
			:items="info.attributes"
			:empty-text="t('ui.sidebar.contact.noAttributes')"
		/>
	</div>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import KeyValueList, {
	type KeyValueListItem,
} from '../key-value-list/key-value-list.vue';
import { toContactInfo } from './scripts/toContactInfo';

const props = defineProps<{
	contact: WebitelContactsContact;
}>();

const { t } = useI18n();

const info = computed(() => toContactInfo(props.contact));

const infoItems = computed<KeyValueListItem[]>(() => [
	{
		id: 'timezone',
		key: t('date.timezone'),
		value: info.value.timezone,
	},
	{
		id: 'owner',
		key: t('objects.owner'),
		value: info.value.owner,
	},
	{
		id: 'groups',
		key: t('ui.sidebar.contact.groups'),
		value: info.value.groups,
	},
]);
</script>

<style scoped>
.contact-card-info {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-card-info__attributes {
	max-height: 120px;
}
</style>
