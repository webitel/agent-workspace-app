<template>
  <section class="ws-page-wrapper">
    <div v-if="!hideHeader" class="ws-page-wrapper__header">
      <slot name="header"></slot>
      <wt-tabs
        v-if="tabs.length"
        :current="currentTab"
        :tabs="tabs"
        @change="changeTab"
      />
      <div
        v-if="actionsPanel"
        class="ws-page-wrapper__actions-panel"
      >
        <slot name="actions-panel"></slot>
      </div>
    </div>

    <div class="ws-page-wrapper__main">
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
	/** name of the route this tab navigates to */
	pathName: string;
}

const props = withDefaults(
	defineProps<{
		hideHeader?: boolean;
		actionsPanel?: boolean;
		tabs?: WsPageTab[];
	}>(),
	{
		hideHeader: false,
		actionsPanel: true,
		tabs: () => [],
	},
);

const route = useRoute();
const router = useRouter();

const currentTab = computed(
	() => props.tabs.find(({ pathName }) => pathName === route.name) ?? {},
);

const changeTab = ({ pathName }: WsPageTab) => {
	if (pathName === route.name) return;
	router.push({
		name: pathName,
	});
};
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
