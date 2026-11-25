<template>
	<wt-button
		class="phone-call-button"
		icon="call--filled"
		:size="ComponentSize.SM"
		:color="ButtonColor.SUCCESS"
		:icon-color="IconColor.SUCCESS"
		:variant="ButtonVariant.TEXT"
		:disabled="disabled"
		:loading="loading"
		:aria-label="t('ui.pages.contacts.phones.call', { number })"
		width-by-content
		@click="emit('click')"
	/>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

/**
 * The green handset that calls a number, one look wherever it is shown; what a
 * click dials is up to the parent, see `useOutboundCall`
 * [WS-170](https://webitel.atlassian.net/browse/WS-170)
 */
defineProps<{
	number?: string;
	disabled?: boolean;
	loading?: boolean;
}>();

const emit = defineEmits<{
	click: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.phone-call-button {
	flex-shrink: 0;
}
</style>
