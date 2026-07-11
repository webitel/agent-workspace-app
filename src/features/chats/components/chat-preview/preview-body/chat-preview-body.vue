<template>
  <div class="chat-preview-body">
    <p>{{ lastMsg }}</p>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
	lastMsg: string; // todo: string??
}>();
</script>

<style scoped>
.chat-preview-body {
    padding: var(--spacing-xs);
    color: var(--grey-lighten-2);
}
</style>