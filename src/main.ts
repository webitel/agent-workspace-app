import { setConfig as setApiServicesConfig } from '@webitel/api-services';
import { setConfig as setChatsServicesConfig } from '@webitel/ui-chats';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import i18n from './app/locale/i18n';
import App from './app/the-app.vue';
import './app/plugins/webitel/ui-sdk';
import { createUserAccessControl } from './app/composables/useUserAccessControl';
import {
	plugin as WebitelUi,
	options as WebitelUiOptions,
} from './app/plugins/webitel/ui-sdk';
import { initRouter, router } from './app/router';
import { setTokenFromUrl } from './app/scripts/setTokenFromUrl';
import { useWorkspaceStore } from './app/stores/workspace';
import { initializeConfig } from './features/AppConfig/config';
import { useUserinfoStore } from './features/userinfo/stores/userinfoStore';

setTokenFromUrl();

setApiServicesConfig({
	eventBus,
});
setChatsServicesConfig({
	i18n,
});

const pinia = createPinia();

const initApp = async () => {
	const app = createApp(App).use(i18n).use(pinia);

	const {
		initialize: initializeUserinfo,
		routeAccessGuard,
		clearStorageNotifications,
	} = useUserinfoStore();

	const { initialize: initializeWorkspace } = useWorkspaceStore();
	try {
		await initializeConfig();
		await initializeUserinfo();
		await initializeWorkspace();
		createUserAccessControl(useUserinfoStore);
		await initRouter({
			beforeEach: [
				routeAccessGuard,
			],
			onUnauthorized: clearStorageNotifications,
		});
	} catch (err) {
		console.error('Error initializing app', err);
	}

	app.use(router);
	app.use(WebitelUi, WebitelUiOptions); // setup webitel ui after router init

	app.mount('#app');

	return app;
};

initApp();
