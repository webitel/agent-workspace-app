import { WtApplication } from '@webitel/ui-sdk/enums';
import {
	createRouter,
	createWebHistory,
	NavigationGuard,
	RouteRecordRaw,
} from 'vue-router';

import AgentWorkspace from '../components/the-agent-workspace.vue';
import TheCallsWorkspace from '../../ui/pages/modules/calls/components/the-calls-workspace.vue';
import TheChatsWorkspace from '../../ui/pages/modules/chats/components/the-chats-workspace.vue';
import TheChatWindow from '../../ui/pages/modules/chats/components/the-chat-window.vue';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'workspace',
		component: AgentWorkspace,
		meta: {
			WtApplication: WtApplication.Agent,
		},
		children: [
			{
				path: '/calls',
				name: 'calls',
				component: TheCallsWorkspace,
			},
			{
				path: '/chats',
				name: 'chats',
				component: TheChatsWorkspace,
				children: [
					{
						path: ':threadId',
						name: 'chat-window',
						component: TheChatWindow,
					},
				],
			},
		],
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

	router.beforeEach((to, _, next) => {
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
