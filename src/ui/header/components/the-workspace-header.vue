<template>
	<wt-app-header>
		<wt-logo
			:dark-mode="darkMode"
			:logo-href="startPageHref"
		/>
		<wt-dark-mode-switcher @changed-mode="setTheme" />
		<open-flows-action />
		<wt-chip :color="isPhoneReg ? 'success' : 'primary'">
			{{ t('ui.header.sip') }}
		</wt-chip>
		<user-dnd-switcher />
		<agent-status-select />
		<wt-call-media-metric
			:quality="level"
			show-tooltip
		/>
	</wt-app-header>
</template>

<script setup lang="ts">
import {
	WtAppHeader,
	WtCallMediaMetric,
	WtChip,
	WtLogo,
} from '@webitel/ui-sdk/components';
import { WtDarkModeSwitcher } from '@webitel/ui-sdk/modules/Appearance';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppearanceStore } from '../../../features/appearance/store/appearanceStore';
import OpenFlowsAction from '../../../features/flows/components/open-flows-action.vue';
import { useGlobalHandlersStore } from '../../../features/global-handlers/store/globalHandlers';
import { useConnectionQualityStore } from '../modules/connectionQuality/store/connectionQuality';
import AgentStatusSelect from './agent-status-select.vue';
import UserDndSwitcher from './user-dnd-switcher.vue';

const { t } = useI18n();

const startPageHref = computed(() => import.meta.env.VITE_START_PAGE_URL);

const appearanceStore = useAppearanceStore();
const darkMode = computed(() => appearanceStore.darkMode);
const { setTheme } = appearanceStore;

const globalHandlersStore = useGlobalHandlersStore();
const { isPhoneReg } = storeToRefs(globalHandlersStore);

const connectionQualityStore = useConnectionQualityStore();
const { level } = storeToRefs(connectionQualityStore);
</script>

<style scoped>
.wt-dark-mode-switcher {
	margin-right: auto;
}
</style>
