<template>
	<wt-popup
		v-if="isOpen"
		size="md"
		@close="emit('close')"
	>
		<template #header>
			{{ t('objects.flow.name', 2) }}
		</template>

		<template #main>
			<section class="flows wt-scrollbar">
				<wt-loader v-if="isLoading" />
				<ul v-else-if="flowsList.length">
					<template
						v-for="(flow, index) in flowsList"
						:key="flow.id"
					>
						<wt-divider v-if="index !== 0" />
						<li class="flows__item">
							<span class="flows__item__name typo-body-2">
								{{ flow.name }}
							</span>
							<run-flow-button
								:id="flow.id"
							/>
						</li>
					</template>
				</ul>
				<wt-empty
					v-else
					:image="emptySearchImage"
					:text="t('webitelUI.dummy.text')"
				/>
			</section>
		</template>

		<template #actions>
			<wt-button
				color="secondary"
				@click="emit('close')"
			>
				{{ t('ui.reusable.cancel') }}
			</wt-button>
		</template>
	</wt-popup>
</template>

<script setup lang="ts">
import { WtEmpty } from '@webitel/ui-sdk/components';
import emptySearchDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-dark.svg';
import emptySearchLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-light.svg';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppearanceStore } from '../../../features/appearance/store/appearanceStore';
import FlowsAPI from '../api/FlowsAPI';
import type { Flow } from '../types/Flow.types';
import RunFlowButton from './run-flow-button.vue';

const emit = defineEmits([
	'close',
]);

const props = defineProps<{
	isOpen: boolean;
}>();

const { t } = useI18n();
const appearanceStore = useAppearanceStore();

const flowsList = ref<Flow[]>([]);
const isLoading = ref(false);

const darkMode = computed(() => appearanceStore.darkMode);

const emptySearchImage = computed(() =>
	darkMode.value ? emptySearchDark : emptySearchLight,
);

const loadFlows = async () => {
	isLoading.value = true;
	try {
		const { items } = await FlowsAPI.getLookup({
			enabled: true,
		});
		flowsList.value = items;
	} catch (err) {
		flowsList.value = [];
	} finally {
		setTimeout(() => {
			isLoading.value = false;
		}, 500);
	}
};

watch(
	() => props.isOpen,
	(open) => {
		if (open) loadFlows();
	},
);
</script>

<style scoped>
	:deep(.wt-popup__popup) {
		height: 100%;
	}

	.wt-loader {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.flows__item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xs);
		gap: var(--spacing-xs);
	}

	.flows__item__name {
		flex: 1;
		overflow-wrap: break-word;
		word-break: break-all;
	}

	.wt-empty {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>