<template>
	<section class="key-value-list">
		<div
			v-if="title"
			class="key-value-list__title typo-body-1-bold"
		>
			{{ title }}
		</div>

		<dl
			v-if="items.length"
			class="key-value-list__items"
		>
			<div
				v-for="item of items"
				:key="item.id"
				class="key-value-list__item typo-body-2"
			>
				<dt class="key-value-list__key typo-body-2-bold">{{ item.key }}:</dt>
				<!-- the template compiler drops whitespace between tags on separate lines -->
				{{ ' ' }}
				<dd class="key-value-list__value">{{ item.value }}</dd>
			</div>
		</dl>

		<p
			v-else-if="emptyText"
			class="key-value-list__empty typo-body-2"
		>
			{{ emptyText }}
		</p>
	</section>
</template>

<script setup lang="ts">
export interface KeyValueListItem {
	/** unique within the list, used as the `v-for` key */
	id: string;
	key: string;
	value: string;
}

withDefaults(
	defineProps<{
		title?: string;
		items: KeyValueListItem[];
		/** shown instead of the rows when there are none */
		emptyText?: string;
	}>(),
	{
		title: '',
		emptyText: '',
	},
);
</script>

<style scoped>
/* the parent caps the height (max-height) when the rows should scroll under a fixed title */
.key-value-list {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	min-height: 0;
}

.key-value-list__items {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
	min-height: 0;
	margin: 0;
	overflow-y: auto;
}

.key-value-list__item {
	word-break: break-word;
}

.key-value-list__key,
.key-value-list__value {
	display: inline;
	margin: 0;
}

.key-value-list__empty {
	margin: 0;
	color: var(--text-disabled-color);
}
</style>
