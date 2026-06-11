import { setConfig as setApiServicesConfig } from '@webitel/api-services';
import { setConfig as setChatsServicesConfig } from '@webitel/ui-chats';
import { eventBus } from '@webitel/ui-sdk/scripts';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import i18n from './app/locale/i18n';
import App from './app/the-app.vue';
import './app/plugins/webitel/ui-sdk';
import { createUserAccessControl } from './app/composables/useUserAccessControl';
import { initRouter, router } from './app/router';
import { initializeConfig } from './features/appConfig/config';
import { useUserinfoStore } from './features/userinfo/stores/userinfoStore';
import { setTokenFromUrl } from './app/scripts/setTokenFromUrl';

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

	const { initialize, routeAccessGuard, clearStorageNotifications } =
		useUserinfoStore();
	try {
		await initializeConfig();
		await initialize();
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

	app.mount('#app');

	return app;
};

initApp();
