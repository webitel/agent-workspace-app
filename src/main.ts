// must stay the first import: wraps console/WebSocket/RTCPeerConnection before the SDK loads
import './app/debug-recorder';
import './app/css/main.css';
import './app/assets/icons/sprite';

import { setConfig as setApiServicesConfig } from '@webitel/api-services';
import { setConfig as setChatsServicesConfig } from '@webitel/ui-chats';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { configureZod } from '@webitel/ui-sdk/validations';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createUserAccessControl } from './app/composables/useUserAccessControl';
import i18n from './app/locale/i18n';
import {
	plugin as WebitelUi,
	options as WebitelUiOptions,
} from './app/plugins/webitel/ui-sdk';
import { initRouter, router } from './app/router';
import { setTokenFromUrl } from './app/scripts/setTokenFromUrl';
import { useWorkspaceStore } from './app/stores/workspace';
import App from './app/the-app.vue';
import { initializeConfig } from './features/appConfig/config';
import { useUserinfoStore } from './features/userinfo/stores/userinfoStore';
import '@webitel/styleguide/agent-workspace-app';
import './app/css/typography.css';

setTokenFromUrl();

setApiServicesConfig({
	eventBus,
});
/**
 * @author Polina Sukhorukova
 * Puts the zod issues of the api-services schemas into the app's words, so a
 * regle-validated field shows a translated error, as in CRM
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
configureZod({
	t: i18n.global.t,
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
