<template>
  <div class="chat-preview-footer">
    <wt-chip
      v-if="queue"
    >
      {{ queue }}
    </wt-chip>
  </div>
</template>

<script lang="ts" setup>
import { WtChip } from '@webitel/ui-sdk/components';

defineProps<{
	queue: string; // string, or object with {id, name}
}>();
</script>

<style scoped></style>