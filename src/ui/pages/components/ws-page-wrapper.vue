<template>
  <section class="ws-page-wrapper">
    <div v-if="!hideHeader" class="ws-page-wrapper__header">
      <slot name="header" />
    </div>
    <div
      v-if="actionsPanel"
      class="ws-page-wrapper__actions-panel"
    >
      <slot name="actions-panel" />
    </div>
    <div class="ws-page-wrapper__main">
      <slot name="main" />
    </div>
  </section>
</template>

<script lang="ts" setup>
const props = withDefaults(
	defineProps<{
		hideHeader?: boolean;
		actionsPanel?: boolean;
	}>(),
	{
		hideHeader: false,
		actionsPanel: true,
	},
);
</script>

<style scoped>
.ws-page-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 100%;
  min-height: 100%;
}

.ws-page-wrapper__header,
.ws-page-wrapper__actions-panel,
.ws-page-wrapper__main {
  box-sizing: border-box;
}

.ws-page-wrapper__header,
.ws-page-wrapper__actions-panel {
  padding: var(--spacing-sm);
}

.ws-page-wrapper__main {
  padding: var(--spacing-sm);
}

.ws-page-wrapper__main {
  display: flex;
  flex: 1;
  width: 100%;
}
</style>
