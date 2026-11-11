<template>
	<div class="contact-switcher">
		<!-- the arrows keep their place when hidden, so the label does not shift -->
		<wt-icon-btn
			v-if="hasPrev"
			class="contact-switcher__prev"
			icon="arrow-left"
			:size="ComponentSize.SM"
			@click="emit('prev')"
		/>
		<span class="contact-switcher__label typo-body-2-bold">
			{{
				t('ui.sidebar.contact.contactPosition', {
					current: props.position,
					count: props.count,
				})
			}}
		</span>
		<wt-icon-btn
			v-if="hasNext"
			class="contact-switcher__next"
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
.contact-switcher {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	gap: var(--spacing-xs);
	padding-block: var(--spacing-2xs);
}

.contact-switcher__prev {
	grid-column: 1;
	justify-self: start;
	padding: var(--spacing-xs);
}

.contact-switcher__label {
	grid-column: 2;
}

.contact-switcher__next {
	grid-column: 3;
	justify-self: end;
	padding: var(--spacing-xs);
}
</style>
