<template>
	<wt-table
		:data="rows"
		:headers="headers"
		:selectable="false"
		:grid-actions="false"
		data-key="key"
	>
		<template #empty>
			<wt-empty
				:image="emptyImage"
				:text="t('ui.reusable.nothingToShowHere')"
			/>
		</template>
	</wt-table>
</template>

<script setup lang="ts">
import type { EngineHistoryCallVariables } from '@webitel/api-services/gen/models';
import { WtTable } from '@webitel/ui-sdk/components';
import { WtTableHeader } from '@webitel/ui-sdk/components/wt-table/types/WtTable';
import emptyTableDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-dark.svg';
import emptyTableLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-light.svg';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemedImage } from '../../../../../../app/composables/useThemedImage';

const props = defineProps<{
	variables?: EngineHistoryCallVariables;
}>();

const { t } = useI18n();

const emptyImage = useThemedImage({
	light: emptyTableLight,
	dark: emptyTableDark,
});

const headers: WtTableHeader[] = [
	{
		value: 'key',
		locale: [
			'vocabulary.keys',
			1,
		],
	},
	{
		value: 'value',
		locale: [
			'vocabulary.values',
			1,
		],
	},
];

const rows = computed(() =>
	Object.entries(props.variables ?? {}).map(([key, value]) => ({
		key,
		value,
	})),
);
</script>
