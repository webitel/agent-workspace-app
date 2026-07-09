<template>
  <div class="chat-preview-footer">
    <wt-chip v-if="queue.name">
      {{ queue.name }}
    </wt-chip>
  </div>
</template>

<script
  lang="ts"
  setup
>
import { WtChip } from '@webitel/ui-sdk/components';

defineProps<{
	queue: {
		id: string | number;
		name: string;
	}; // string, or object with {id, name}
}>();
</script>

<style scoped></style>