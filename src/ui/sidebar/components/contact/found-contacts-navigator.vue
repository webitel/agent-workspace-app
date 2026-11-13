<template>
	<div class="found-contacts-navigator">
		<!-- every item has its own grid column, so the label stays centered when an arrow is hidden -->
		<wt-icon-btn
			v-if="hasPrev"
			class="found-contacts-navigator__prev"
			icon="arrow-left"
			:size="ComponentSize.SM"
			@click="emit('prev')"
		/>
		<span class="found-contacts-navigator__label typo-body-2-bold">
			{{
				t('ui.sidebar.contact.contactPosition', {
					current: props.position,
					count: props.count,
				})
			}}
		</span>
		<wt-icon-btn
			v-if="hasNext"
			class="found-contacts-navigator__next"
			icon="arrow-right"
			:size="ComponentSize.SM"
			@click="emit('next')"
		/>
	</div>
</template>

<script setup lang="ts">
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	// 1-based number of the shown contact
	position: number;
	count: number;
}>();

const emit = defineEmits<{
	prev: [];
	next: [];
}>();

const { t } = useI18n();

const hasPrev = computed(() => props.position > 1);
const hasNext = computed(() => props.position < props.count);
</script>

<style scoped>
.found-contacts-navigator {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	gap: var(--spacing-xs);
	padding-block: var(--spacing-2xs);
}

.found-contacts-navigator__prev {
	grid-column: 1;
	justify-self: start;
	padding: var(--spacing-xs);
}

.found-contacts-navigator__label {
	grid-column: 2;
}

.found-contacts-navigator__next {
	grid-column: 3;
	justify-self: end;
	padding: var(--spacing-xs);
}
</style>
