<template>
	<section
		v-if="call"
		class="the-call-window"
	>
		<wt-tabs
			class="the-call-window__tabs"
			:current="{ value: activeTab }"
			:tabs="tabs"
			@change="handleTabChange"
		>
			<!-- WtTabs has no disabled state; its buttons stay clickable, so the
			     handler ignores these and the span below greys the label out -->
			<template
				v-for="tab in disabledTabs"
				:key="tab.value"
				#[tab.value]
			>
				<span
					class="the-call-window__tab--disabled"
					aria-disabled="true"
				>
					{{ tab.text }}
				</span>
			</template>
		</wt-tabs>

		<wt-divider />

		<call-top-bar
			class="the-call-window__top-bar"
			:call="call"
		/>

		<keep-alive>
			<component
				:is="currentTab.is"
				v-bind="currentTab.props"
				class="the-call-window__panel"
			/>
		</keep-alive>
	</section>
</template>

<script
	setup
	lang="ts"
>
import { WtDivider, WtTabs } from '@webitel/ui-sdk/components';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import CallInfo from '../../../../../features/calls/components/call-info/call-info.vue';
import CallTopBar from '../../../../../features/calls/components/call-top-bar/call-top-bar.vue';
import { useCallsStore } from '../../../../../features/calls/store/calls';
import TheProcessingForm from '../../../../../features/processing/components/the-processing-form.vue';
import { useProcessingStore } from '../../../../../features/processing/store/processing';

type CallWindowTab = 'info' | 'processing';

interface CallWindowTabItem {
	value: string;
	text: string;
	/** the tab shows in the strip (US_03.04, US_03.05) but has no content yet */
	disabled?: boolean;
}

const { t } = useI18n();
const route = useRoute();
const callsStore = useCallsStore();
const callId = computed(() => route.params.callId as string);

const call = computed(() => callsStore.getCallById(callId.value));

// A manual dial or an internal call has no task, and so never a form
// (WS-91). The SDK back-fills the task when it arrives after the call.
const task = computed(() => call.value?.task ?? null);
const processing = computed(() =>
	task.value ? useProcessingStore(task.value) : null,
);
const hasForm = computed(() => Boolean(processing.value?.hasForm));
const isPostProcessing = computed(() =>
	Boolean(processing.value?.isPostProcessing),
);

// Post-processing is where an unfinished form belongs; otherwise the variables.
const defaultTab = (): CallWindowTab =>
	hasForm.value && isPostProcessing.value ? 'processing' : 'info';

const activeTab = ref<CallWindowTab>(defaultTab());

// The chat window's strip, for a call: Info, Post-processing, then the tabs
// whose content is not built yet. Only Post-processing comes and goes with the
// form, and a form arriving mid-call does not pull the agent away from Info.
const tabs = computed<CallWindowTabItem[]>(() => [
	{
		value: 'info',
		text: t('ui.pages.calls.tabs.info'),
	},
	...(hasForm.value
		? [
				{
					value: 'processing',
					text: t('ui.pages.calls.tabs.postProcessing'),
				},
			]
		: []),
	{
		value: 'interaction',
		text: t('ui.pages.calls.tabs.interaction'),
		disabled: true,
	},
	{
		value: 'contact',
		text: t('ui.pages.calls.tabs.contact'),
		disabled: true,
	},
]);

const disabledTabs = computed(() => tabs.value.filter((tab) => tab.disabled));

function handleTabChange(tab: CallWindowTabItem) {
	if (tab.disabled) return;
	activeTab.value = tab.value as CallWindowTab;
}

// keep-alive preserves each panel (form input, table sort) across switches;
// leaving the window altogether keeps the input too, since it lives on the SDK
// form (ADR-0004, AC_13.02.04).
const currentTab = computed(() => {
	if (activeTab.value === 'processing' && task.value) {
		return {
			is: TheProcessingForm,
			props: {
				task: task.value,
			},
		};
	}
	return {
		is: CallInfo,
		props: {
			call: call.value,
		},
	};
});

// Opening a call lands on its form when it is already in post-processing.
watch(callId, () => {
	activeTab.value = defaultTab();
});

// The call ending with a form waiting — or a form landing once it has ended —
// is the cue to fill it in.
watch(
	() => hasForm.value && isPostProcessing.value,
	(value) => {
		if (value) activeTab.value = 'processing';
	},
);

// Nothing left to show on the tab once the form is gone.
watch(hasForm, (value) => {
	if (!value && activeTab.value === 'processing') activeTab.value = 'info';
});
</script>

<style scoped>
.the-call-window {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--wt-ws-layout-sizes-root-gap);
	height: 100%;
	min-height: 0;
	min-width: 0;
}

/* the page toolbar of DES-730 */
.the-call-window__tabs {
	--tab-gap: var(--wt-ws-page-toolbar-sizes-gap);
	--tab-underline-border-radius: var(--border-radius--pill);

	flex: 0 0 auto;
	padding: var(--wt-ws-page-toolbar-sizes-padding-y)
		var(--wt-ws-page-toolbar-sizes-padding-right)
		var(--wt-ws-page-toolbar-sizes-padding-y)
		var(--wt-ws-page-toolbar-sizes-padding-left);
	border-radius: var(--wt-ws-page-toolbar-sizes-border-radius);
	background: var(--wt-ws-page-toolbar-colors-background);
}

.the-call-window__tab--disabled {
	display: block;
	opacity: 0.4;
}

.the-call-window__top-bar {
	flex: 0 0 auto;
}

.the-call-window__panel {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}
</style>
