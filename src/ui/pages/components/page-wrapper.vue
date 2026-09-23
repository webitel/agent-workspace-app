<template>
  <section class="page-wrapper">
    <div class="page-wrapper__header">
      <slot name="header"></slot>
      <wt-tabs
        v-if="tabs.length"
        :current="currentTab"
        :tabs="tabs"
        @change="changeTab"
      />
      <div
        v-if="actionsPanel"
        class="page-wrapper__actions-panel"
      >
        <slot name="actions-panel"></slot>
      </div>
    </div>

    <div class="page-wrapper__main">
      <slot name="main" > </slot>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export interface WsPageTab {
	text: string;
	value: string;
	pathName: string;
}

const props = withDefaults(
	defineProps<{
		actionsPanel?: boolean;
		tabs?: WsPageTab[];
	}>(),
	{
		actionsPanel: true,
		tabs: () => [],
	},
);

const route = useRoute();
const router = useRouter();

const currentTab = computed(() =>
	props.tabs.find(({ pathName }) => pathName === route.name),
);

const changeTab = ({ pathName }: WsPageTab) => {
	if (pathName === route.name) return;
	router.push({
		name: pathName,
	});
};
</script>

<style scoped>
.page-wrapper {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 100%;
  height: 100%;
  padding: var(--spacing-sm);
  gap: var(--spacing-xs);
}

.page-wrapper__header,
.page-wrapper__actions-panel,
.page-wrapper__main {
  box-sizing: border-box;
}

.page-wrapper__header,
.page-wrapper__actions-panel {
  display: flex;
  align-items: center;
}

.page-wrapper__header {
  justify-content: space-between;
}

.page-wrapper__main {
  display: flex;
  flex: 1;
  width: 100%;
}
</style>
