<template>
	<div class="contact-card-header">
		<div class="contact-card-header__identity">
			<wt-avatar
				:size="ComponentSize.SM"
				:username="name"
			/>
			<span class="contact-card-header__name typo-body-2-bold">{{ name }}</span>
		</div>

		<wt-divider />

		<div
			v-if="labels.length"
			class="contact-card-header__labels"
		>
			<wt-chip
				v-for="(label, index) of labels"
				:key="`${label}-${index}`"
				:color="ChipColor.SECONDARY"
			>
				{{ label }}
			</wt-chip>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { ChipColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';

const props = defineProps<{
	contact: WebitelContactsContact;
}>();

const name = computed(() => props.contact.name?.commonName ?? '');

const labels = computed(
	() =>
		props.contact.labels?.data
			?.map(({ label }) => label)
			.filter((label): label is string => Boolean(label)) ?? [],
);
</script>

<style scoped>
.contact-card-header {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-card-header__identity {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.contact-card-header__labels {
	display: flex;
	flex-wrap: wrap;
	gap: var(--spacing-2xs);
}
</style>
