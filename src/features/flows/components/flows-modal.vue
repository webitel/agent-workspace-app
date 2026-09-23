<template>
	<wt-popup
		v-if="isOpen"
		size="md"
		height="600px"
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
						<li class="flow-item">
							<span class="flow-item__name typo-body-2">
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
				{{ t('reusable.cancel') }}
			</wt-button>
		</template>
	</wt-popup>
</template>

<script setup lang="ts">
import { WtEmpty } from '@webitel/ui-sdk/components';
import { useMinDurationLoader } from '@webitel/ui-sdk/composables';
import emptySearchDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-dark.svg';
import emptySearchLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-light.svg';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppearanceStore } from '../../../features/appearance/store/appearanceStore';
import FlowsAPI from '../api/FlowsAPI';
import type { Flow } from '../types/Flow.types';
import RunFlowButton from './run-flow-button.vue';

const props = defineProps<{
	isOpen: boolean;
}>();

const emit = defineEmits<{
	close: [];
}>();

const { t } = useI18n();
const appearanceStore = useAppearanceStore();

const { isLoading, runWithMinDuration } = useMinDurationLoader();

const flowsList = ref<Flow[]>([]);

const darkMode = computed(() => appearanceStore.darkMode);

const emptySearchImage = computed(() =>
	darkMode.value ? emptySearchDark : emptySearchLight,
);

const loadFlows = () => {
	runWithMinDuration(async () => {
		try {
			const { items } = await FlowsAPI.getLookup({
				enabled: true,
			});
			flowsList.value = items;
		} catch (err) {
			flowsList.value = [];
		}
	});
};

watch(
	() => props.isOpen,
	(open) => {
		if (open) loadFlows();
	},
);
</script>

<style scoped>
	.wt-loader {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.flows {
		height: 100%;
	}

	.flow-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-xs);
		gap: var(--spacing-xs);
	}

	.flow-item__name {
		flex: 1;
		overflow-wrap: break-word;
		word-break: break-all;
	}

	.wt-empty {
		height: 100%;
	}
</style>