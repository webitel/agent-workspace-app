<template>
    <wt-app-header>
      <wt-logo
        :dark-mode="darkMode"
        :logo-href="startPageHref"
      />
      <wt-dark-mode-switcher @changed-mode="setTheme" />
      <wt-chip :color="isPhoneReg ? 'success' : 'primary'">
        {{ t('ui.header.sip') }}
      </wt-chip>
      <user-dnd-switcher />
      <agent-status-select />
      <wt-call-media-metric
        :quality="level"
        show-tooltip
      />
      <wt-app-navigator
        :current-app="currentApp"
        :apps="apps"
        :dark-mode="darkMode"
      />
      <wt-header-actions
        :user="userInfo"
        :build-info="buildInfo"
        @settings="openSettings"
        @logout="logoutUser"
      />
    </wt-app-header>
</template>

<script setup lang="ts">
import {
	WtAppHeader,
	WtAppNavigator,
	WtCallMediaMetric,
	WtChip,
	WtHeaderActions,
	WtLogo,
} from '@webitel/ui-sdk/components';
import { WtApplication } from '@webitel/ui-sdk/enums';
import { WtDarkModeSwitcher } from '@webitel/ui-sdk/modules/Appearance';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import packageJson from '../../../../package.json' with { type: 'json' };
import { getConfig } from '../../../features/appConfig/config';
import { useAppearanceStore } from '../../../features/appearance/store/appearanceStore';
import { useGlobalHandlersStore } from '../../../features/global-handlers/store/globalHandlers';
import { useUserinfoStore } from '../../../features/userinfo/stores/userinfoStore';
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

const userinfoStore = useUserinfoStore();
const { hasApplicationVisibility, logoutUser } = userinfoStore;
const { userInfo } = storeToRefs(userinfoStore);

const isOnSite = ref(false);

const currentApp = WtApplication.Agent;

const buildInfo = {
	release: packageJson.version,
	build: import.meta.env.VITE_BUILD_NUMBER,
};

const navigatorApps: {
	name: WtApplication;
	href: string;
}[] = [
	{
		name: WtApplication.Agent,
		href: import.meta.env.VITE_AGENT_URL,
	},
	{
		name: WtApplication.Supervisor,
		href: import.meta.env.VITE_SUPERVISOR_URL,
	},
	{
		name: WtApplication.History,
		href: import.meta.env.VITE_HISTORY_URL,
	},
	{
		name: WtApplication.Admin,
		href: import.meta.env.VITE_ADMIN_URL,
	},
	{
		name: WtApplication.Audit,
		href: import.meta.env.VITE_AUDIT_URL,
	},
	{
		name: WtApplication.Crm,
		href: import.meta.env.VITE_CRM_URL,
	},
];

const analyticsApp = {
	name: WtApplication.Analytics,
	href: import.meta.env.VITE_GRAFANA_URL,
};

const apps = computed(() => {
	const available = isOnSite.value
		? [
				...navigatorApps,
				analyticsApp,
			]
		: navigatorApps;

	return available.filter(({ name }) => hasApplicationVisibility(name));
});

function openSettings() {
	const settingsUrl = import.meta.env.VITE_SETTINGS_URL;
	window.open(settingsUrl);
}

onMounted(async () => {
	isOnSite.value = (await getConfig()).ON_SITE;
});
</script>

<style scoped>
.wt-dark-mode-switcher {
  margin-right: auto;
}
</style>
