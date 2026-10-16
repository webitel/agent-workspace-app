<template>
  <div class="table-cell-info">
    <wt-icon
      v-if="icon"
      :icon="icon"
      :color="iconColor"
      size="sm"
    />

    <wt-display-chip-items :items="chipItems" />
  </div>
</template>

<script setup lang="ts">
import { WtDisplayChipItems } from '@webitel/ui-sdk/components';
import { IconColor } from '@webitel/ui-sdk/enums';
import { computed } from 'vue';

type TableCellInfoItem = string | object;

const props = withDefaults(
	defineProps<{
		icon?: string;
		iconColor?: IconColor;
		items?: TableCellInfoItem[];
		itemLabel?: string;
	}>(),
	{
		icon: '',
		iconColor: IconColor.DEFAULT,
		items: () => [],
		itemLabel: 'name',
	},
);

const chipItems = computed(() =>
	props.items.map((item, index) => {
		if (typeof item === 'string')
			return {
				id: `${index}`,
				name: item,
			};

		const { id, [props.itemLabel]: label } = item as Record<string, unknown>;

		return {
			id: `${id ?? index}`,
			name: `${label ?? ''}`,
		};
	}),
);
</script>

<style scoped>
.table-cell-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
</style>
