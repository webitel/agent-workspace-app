<template>
	<div class="communication-cell-list">
		<slot name="icon">
			<communication-cell-icon
				:icon="icon"
				:color="iconColor"
			/>
		</slot>

		<span
			v-if="value"
			class="communication-cell-list__value"
		>
			{{ value }}
		</span>

		<wt-context-menu
			v-if="moreCount"
			:options="menuOptions"
			:disabled="disabled"
			@click="onOptionClick"
		>
			<template #activator="{ toggle }">
				<wt-tooltip>
					<template #activator>
						<wt-chip
							class="communication-cell-list__more"
							:color="ChipColor.SECONDARY"
							@click="toggle"
						>
							+{{ moreCount }}
						</wt-chip>
					</template>
					<slot
						name="more-tooltip"
						:count="moreCount"
					/>
				</wt-tooltip>
			</template>

			<template #option="{ text }">
				<span class="communication-cell-list__option">
					<wt-icon
						:icon="icon"
						:size="ComponentSize.SM"
						:color="iconColor"
					/>
					{{ text }}
				</span>
			</template>
		</wt-context-menu>
	</div>
</template>

<script setup lang="ts">
/**
 * @author Polina Sukhorukova
 * The look shared by the contacts table's Phone number, Chat and Email
 * columns: the column's icon, the shown value, and a "+N" chip with a tooltip
 * that opens a menu of every value. What to show and what a menu row does is
 * up to each column's cell
 * [WS-177](https://webitel.atlassian.net/browse/WS-177)
 */
import { WtChip, WtContextMenu, WtTooltip } from '@webitel/ui-sdk/components';
import {
	ChipColor,
	ComponentSize,
	type IconColor,
} from '@webitel/ui-sdk/enums';
import { computed } from 'vue';
import CommunicationCellIcon from './communication-cell-icon.vue';

const props = withDefaults(
	defineProps<{
		/** the value shown in the column; none leaves the icon alone */
		value?: string;
		/** every value of the column, the shown one included */
		options?: string[];
		icon: string;
		iconColor: IconColor;
		disabled?: boolean;
	}>(),
	{
		value: '',
		options: () => [],
		disabled: false,
	},
);

const emit = defineEmits<{
	select: [
		value: string,
	];
}>();

const moreCount = computed(() => Math.max(props.options.length - 1, 0));

const menuOptions = computed(() =>
	props.options.map((text) => ({
		text,
	})),
);

function onOptionClick({
	option,
}: {
	option: {
		text: string;
	};
}) {
	emit('select', option.text);
}
</script>

<style scoped>
.communication-cell-list {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.communication-cell-list__more {
	cursor: pointer;
}

.communication-cell-list__option {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>
