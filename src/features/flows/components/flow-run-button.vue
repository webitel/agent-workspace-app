<template>
    <wt-button
      color="success"
      :loading="isLoading"
      :size="size ? size : 'md'"
      @click="runFlow"
    >
      {{ $t('ui.reusable.run') }}
    </wt-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

//import FlowsAPI from '../api/flows.js';

const props = defineProps({
	item: {
		type: Object,
		required: true,
	},
	size: {
		type: String,
		required: false,
	},
});

const isLoading = ref(false);

async function runFlow() {
	try {
		isLoading.value = true;
		//await FlowsAPI.run(props.item);
	} finally {
		isLoading.value = false;
	}
}
</script>
