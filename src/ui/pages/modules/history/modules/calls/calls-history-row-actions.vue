<template>
	<div class="calls-history-row-actions">
		<calls-history-media-action
			:files="item.files"
			@play="emit('play', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
import type {
	EngineCallFile,
	EngineHistoryCall,
} from '@webitel/api-services/gen/models';
import CallsHistoryMediaAction from './calls-history-media-action.vue';

defineProps<{
	item: EngineHistoryCall;
}>();

const emit = defineEmits<{
	play: [
		file: EngineCallFile,
	];
}>();
</script>

<style scoped>
.calls-history-row-actions {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}
</style>