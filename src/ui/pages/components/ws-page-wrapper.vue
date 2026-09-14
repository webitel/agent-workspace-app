<template>
  <section class="ws-page-wrapper">
    <div v-if="!hideHeader" class="ws-page-wrapper__header">
      <slot name="header"></slot>
      <div
        v-if="actionsPanel"
        class="ws-page-wrapper__actions-panel"
      >
        <slot name="actions-panel"></slot>
        <wt-search-bar
          v-if="search"
          :value="searchValue"
          @input="emit('update:search-value', $event)"
          @search="emit('search', $event)"
        />
        <wt-icon-btn :icon="sidebarIcon" @click="toggleSidebar" />
      </div>
    </div>

    <div class="ws-page-wrapper__main">
      <slot name="main" />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useWorkspaceSidebarStore } from '../../sidebar/store/workspace-sidebar';
import { WtIconBtn, WtSearchBar } from '@webitel/ui-sdk/components';

const props = withDefaults(
	defineProps<{
		hideHeader?: boolean;
		actionsPanel?: boolean;
		search?: boolean;
		searchValue?: string;
	}>(),
	{
		hideHeader: false,
		actionsPanel: true,
		search: false,
		searchValue: '',
	},
);

const { isOpen, toggle: toggleSidebar } = useWorkspaceSidebarStore();

const emit = defineEmits<{
	'update:search-value': [
		value: string,
	];
	search: [
		value: string,
	];
}>();

const sidebarIcon = computed(() =>
	isOpen ? 'ws-sidebar-open' : 'ws-sidebar-close',
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
  display: flex;
  align-items: center;
  padding: var(--spacing-sm);
}

.ws-page-wrapper__header {
  justify-content: space-between;
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
