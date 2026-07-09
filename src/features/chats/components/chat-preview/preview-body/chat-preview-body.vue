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

<style scoped></style>