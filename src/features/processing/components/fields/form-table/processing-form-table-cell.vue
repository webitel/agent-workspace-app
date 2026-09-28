<template>
	<wt-icon
		v-if="type === ProcessingTableColumnType.BOOL"
		:color="value ? 'success' : 'error'"
		:icon="`${Boolean(value)}-ic`"
	/>
	<span v-else-if="isEmptyValue">{{ EMPTY }}</span>
	<span v-else-if="type === ProcessingTableColumnType.DATETIME">{{ dateTime }}</span>
	<ul v-else-if="type === ProcessingTableColumnType.LINK">
		<li
			v-for="(link, index) in links"
			:key="index"
		>
			<a
				v-if="safeHref(link)"
				:href="safeHref(link)"
				class="processing-form-table-cell__link"
				rel="noopener noreferrer"
				target="_blank"
			>{{ link }}</a>
			<span v-else>{{ link }}</span>
		</li>
	</ul>
	<span v-else>{{ joined }}</span>
</template>

<script setup lang="ts">
import {
	FormatDateMode,
	ProcessingTableColumnType,
} from '@webitel/ui-sdk/enums';
import { formatDate } from '@webitel/ui-sdk/utils';
import { computed } from 'vue';

const EMPTY = '-';

const props = defineProps<{
	value?: unknown;
	/** ProcessingTableColumnType */
	type?: string;
}>();

// 0 is a value; booleans always render (false included).
const isEmptyValue = computed(
	() =>
		props.value === undefined ||
		props.value === null ||
		props.value === '' ||
		(Array.isArray(props.value) && !props.value.length),
);

const joined = computed(() =>
	Array.isArray(props.value) ? props.value.join(', ') : String(props.value),
);

const dateTime = computed(() =>
	formatDate(Number(props.value), FormatDateMode.DATETIME),
);

const links = computed(() =>
	(Array.isArray(props.value)
		? props.value
		: [
				props.value,
			]
	).map(String),
);

// Cells show records from arbitrary endpoints: link only what cannot run
// script in the workspace (no `javascript:` / `data:`).
function safeHref(link: string) {
	try {
		const url = new URL(link);
		return [
			'https:',
			'http:',
			'mailto:',
			'tel:',
		].includes(url.protocol)
			? url.href
			: '';
	} catch {
		return '';
	}
}
</script>

<style scoped>
.processing-form-table-cell__link {
	color: var(--link-color, var(--info-color));
}
</style>
