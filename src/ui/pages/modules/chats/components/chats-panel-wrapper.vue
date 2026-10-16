<template>
	<section class="chats-panel-wrapper">
		<header class="chats-panel-wrapper__header">
			<wt-tabs
				:current="current"
				:tabs="tabs"
				@change="emit('change', $event)"
			>
				<template
					v-for="tab in slottedTabs"
					:key="tab.value"
					#[tab.value]="scope"
				>
					<slot
						:name="tab.value"
						v-bind="scope"
					/>
				</template>
			</wt-tabs>

			<div
				v-if="slots['actions-panel']"
				class="chats-panel-wrapper__actions-panel"
			>
				<slot name="actions-panel" />
			</div>
		</header>

		<wt-divider />

		<div class="chats-panel-wrapper__main">
			<slot name="main" />
		</div>
	</section>
</template>

<script
	setup
	lang="ts"
	generic="TTab extends ChatsPanelTab"
>
import { WtDivider, WtTabs } from '@webitel/ui-sdk/components';
import { computed, useSlots } from 'vue';
import type { ChatsPanelTab } from '../types/ChatsPanelTab.types';

const props = defineProps<{
	tabs: TTab[];
	current?: Pick<ChatsPanelTab, 'value'>;
}>();

const emit = defineEmits<{
	change: [
		tab: TTab,
	];
}>();

const slots = useSlots();

// only tabs the parent customises get a slot, the rest keep WtTabs' own label
const slottedTabs = computed(() =>
	props.tabs.filter((tab) => slots[tab.value]),
);
</script>

<style scoped>
.chats-panel-wrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--wt-ws-layout-sizes-root-gap);
	height: 100%;
	min-height: 0;
	min-width: 0;
	padding: var(--wt-ws-layout-sizes-root-padding);
}

/* the page toolbar of DES-730 */
.chats-panel-wrapper__header {
	--tab-gap: var(--wt-ws-page-toolbar-sizes-gap);
	--tab-underline-border-radius: var(--border-radius--pill);

	flex: 0 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--wt-ws-page-toolbar-sizes-padding-y)
		var(--wt-ws-page-toolbar-sizes-padding-right)
		var(--wt-ws-page-toolbar-sizes-padding-y)
		var(--wt-ws-page-toolbar-sizes-padding-left);
	border-radius: var(--wt-ws-page-toolbar-sizes-border-radius);
	background: var(--wt-ws-page-toolbar-colors-background);
}

.chats-panel-wrapper__actions-panel {
	display: flex;
	align-items: center;
}

.chats-panel-wrapper__main {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--wt-ws-layout-sizes-root-gap);
	min-height: 0;
}
</style>