import { WtApplication } from '@webitel/ui-sdk/enums';
import { createRouter, createWebHistory, NavigationGuard } from 'vue-router';

import AgentWorkspace from '../components/the-agent-workspace.vue';

const routes = [
	{
		path: '/',
		name: 'workspace',
		component: AgentWorkspace,
		meta: {
			WtApplication: WtApplication.Agent,
		},
	},
];

export let router = null;

export const initRouter = async ({
	beforeEach,
	onUnauthorized,
}: {
	beforeEach: NavigationGuard[];
	onUnauthorized: () => void;
}) => {
	router = createRouter({
		history: createWebHistory(import.meta.env.BASE_URL),
		routes,
		scrollBehavior() {
			return {
				left: 0,
				top: 0,
			};
		},
	});

	router.beforeEach((to, from, next) => {
		if (!localStorage.getItem('access-token') && !to.query.accessToken) {
			// @author @Lear24
			// remove flag about shown notifications from localStorage
			onUnauthorized();
			const desiredUrl = encodeURIComponent(window.location.href);
			const authUrl = import.meta.env.VITE_AUTH_URL;
			window.location.href = `${authUrl}?redirectTo=${desiredUrl}`;
			return;
		}
		if (to.query.accessToken) {
			// assume that access token was set from query before app initialization in main.js
			const newQuery = {
				...to.query,
			};
			delete newQuery.accessToken;
			return next({
				...to,
				query: newQuery,
			});
		}

		next();
	});

	beforeEach.forEach((guard) => {
		router.beforeEach(guard);
	});

	return router;
};
