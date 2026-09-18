<template>
	<wt-popup
		v-if="isOpen"
		size="md"
		@close="emit('close')"
	>
		<template #header>
				Flow schemas
		</template>
		<template #main>
			<section class="flows-tab wt-scrollbar">
				<ul v-if="flowsList.length">
					<div
						v-for="(flow) in flowsList"
						:key="flow.id"
						class="flows-tab-item-wrapper"
					>
						<li class="flows-tab-item">
							<span class="flows-tab-item__name typo-body-1">
								{{ flow.name }}
							</span>
							<flow-run-button
								class="flow-tab__button"
								:item="flow"
								size="md"
								width-by-content
							/>
						</li>
						<wt-divider />
					</div>
				</ul>
			</section>
		</template>
	</wt-popup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FlowRunButton from './flow-run-button.vue';

const emit = defineEmits([
	'close',
]);
const props = defineProps({
	isOpen: {
		type: Boolean,
		required: true,
	},
});

const flowsList = ref([
	{
		id: 1,
		name: 'Flow 1',
	},
]);
</script>

<style scoped>

</style>