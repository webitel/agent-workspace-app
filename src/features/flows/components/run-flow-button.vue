<template>
	<wt-button
		color="success"
		:loading="isLoading"
		size="sm"
		@click="runFlow"
	>
			{{ t('ui.reusable.run') }}
	</wt-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FlowsAPI from '../api/FlowsAPI';

const props = defineProps<{
	id: number;
}>();

const { t } = useI18n();

const isLoading = ref(false);

async function runFlow() {
	try {
		isLoading.value = true;
		await FlowsAPI.run({
			id: props.id,
		});
	} finally {
		isLoading.value = false;
	}
}
</script>
