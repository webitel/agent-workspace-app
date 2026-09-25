<template>
	<div class="processing-form-select-service">
		<wt-expansion-panel :collapsed="table?.defaultCollapsed">
			<template #title>
				<div class="processing-form-select-service__title">
					<div class="processing-form-select-service__title-icon">
						<wt-icon
							color="on-dark"
							icon="union"
						/>
					</div>
					<span>{{ title }}</span>
				</div>
			</template>

			<div class="processing-form-select-service__content">
				<wt-search-bar
					:value="search"
					full-width
					@input="search = $event"
					@search="loadCatalogs"
				/>
				<wt-loader
					v-if="isLoading"
					class="processing-form-select-service__tree"
				/>
				<wt-tree
					v-else
					:data="catalogs"
					:model-value="selectedId"
					children-prop="service"
					class="processing-form-select-service__tree"
					item-data="id"
					item-label="name"
					@update:model-value="emit('update:modelValue', $event)"
				>
					<template #item-prefix="{ data }">
						<wt-icon-btn
							v-tooltip.bottom="data.description"
							:disabled="!data.description"
							class="processing-form-select-service__description"
							color="info"
							icon="docs"
							size="sm"
						/>
					</template>
				</wt-tree>
			</div>
		</wt-expansion-panel>
	</div>
</template>

<script setup lang="ts">
import { ServiceCatalogsAPI } from '@webitel/api-services/api';
import { computed, onMounted, ref } from 'vue';

import type { ServiceCatalogNode } from '../../types/ProcessingForm.types';

// Seeded as a service record, picked as its id (what wt-tree emits).
const props = withDefaults(
	defineProps<{
		modelValue?: unknown;
		/** reuses the table view settings: `headerTitle`, `defaultCollapsed` */
		table?: {
			headerTitle?: string;
			defaultCollapsed?: boolean;
		};
	}>(),
	{
		modelValue: null,
		table: undefined,
	},
);

const emit = defineEmits<{
	'update:modelValue': [
		value: unknown,
	];
}>();

// the renderer passes model-value / label-props to every field
defineOptions({
	inheritAttrs: false,
});

const search = ref('');
const catalogs = ref<ServiceCatalogNode[]>([]);
const isLoading = ref(false);

const selectedId = computed(() =>
	props.modelValue && typeof props.modelValue === 'object'
		? (props.modelValue as ServiceCatalogNode).id
		: (props.modelValue ?? null),
);

// Catalog / service / sub-service names down to the selected one (WTEL-6955).
function findPath(
	nodes: ServiceCatalogNode[],
	targetId: unknown,
	path: string[] = [],
): string[] | null {
	for (const node of nodes) {
		const nodePath = [
			...path,
			node.name,
		];
		if (node.id === targetId) return nodePath;
		const found = findPath(node.service ?? [], targetId, nodePath);
		if (found) return found;
	}
	return null;
}

// Derived rather than watched: cc-workspaces only recomputed it on a new pick,
// so a seeded service never showed its path.
const selectedPath = computed(() => {
	if (selectedId.value === null) return null;
	for (const catalog of catalogs.value) {
		const path = findPath(catalog.service ?? [], selectedId.value);
		if (path)
			return [
				catalog.name,
				...path,
			];
	}
	return null;
});

const title = computed(
	() =>
		selectedPath.value?.join(' / ') ||
		props.table?.headerTitle ||
		'Select a service',
);

async function loadCatalogs() {
	isLoading.value = true;
	try {
		const { items } = await ServiceCatalogsAPI.getList({
			size: -1, // every catalog, with its services
			search: search.value,
			fields: [
				'id',
				'name',
				'closeReasonGroup',
				'status',
				'service',
				'description',
			],
			hasSubservices: true,
			state: true,
		});
		catalogs.value = (items ?? []) as ServiceCatalogNode[];
	} finally {
		isLoading.value = false;
	}
}

onMounted(() => {
	loadCatalogs().catch(() => {});
});
</script>

<style scoped>
.processing-form-select-service__content {
	padding: var(--spacing-sm);
}

.processing-form-select-service__tree {
	height: 350px;
}

.processing-form-select-service__title {
	display: flex;
	align-items: center;
	gap: var(--spacing-sm);
}

.processing-form-select-service__title-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--icon-md-size);
	height: var(--icon-md-size);
	border-radius: var(--border-radius);
	background: var(--icon-info-color, var(--info-color));
}

.processing-form-select-service__description {
	flex-shrink: 0;
	margin: auto 0;
}
</style>
