import { WtApplication } from '@webitel/ui-sdk/enums';
import { defineComponent } from 'vue';
import {
	createRouter,
	createWebHistory,
	type NavigationGuard,
	type RouteRecordRaw,
} from 'vue-router';
import { CallsPageTab } from '../../ui/pages/modules/calls/enums/CallsPageTab.enum';
import TheCallsPage from '../../ui/pages/modules/calls/the-calls-page.vue';
import TheChatWindow from '../../ui/pages/modules/chats/components/the-chat-window.vue';
import TheChatsWorkspace from '../../ui/pages/modules/chats/components/the-chats-workspace.vue';
import { ChatsPageTab } from '../../ui/pages/modules/chats/enums/ChatsPageTab.enum';
import TheChatsPage from '../../ui/pages/modules/chats/the-chats-page.vue';
import TheContactsPage from '../../ui/pages/modules/contacts/the-contacts-page.vue';
import { HistoryPageTab } from '../../ui/pages/modules/history/enums/HistoryPageTab.enum';
import TheHistoryPage from '../../ui/pages/modules/history/the-history-page.vue';
import TheTasksWorkspace from '../../ui/pages/modules/tasks/components/the-tasks-workspace.vue';
import AgentWorkspace from '../components/the-agent-workspace.vue';
import { createAuthGuard } from './authGuard';

// Contacts tabs render entirely inside TheContactsPage (no <router-view>),
// so these child routes only need to exist for route.name matching/navigation.
const NoopRouteComponent = defineComponent({
	render: () => null,
});

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
				component: TheCallsPage,
				children: [
					{
						path: '',
						name: CallsPageTab.Missed,
						component: NoopRouteComponent,
					},
					{
						path: 'offline',
						name: CallsPageTab.Offline,
						component: NoopRouteComponent,
					},
				],
			},
			{
				path: '/chats',
				component: TheChatsWorkspace,
				children: [
					{
						path: '',
						component: TheChatsPage,
						children: [
							{
								path: '',
								name: ChatsPageTab.Active,
								component: NoopRouteComponent,
							},
						],
					},
					{
						path: ':threadId',
						name: 'chat-window',
						component: TheChatWindow,
					},
				],
			},
			{
				path: '/tasks',
				name: 'tasks',
				component: TheTasksWorkspace,
			},
			{
				path: '/contacts',
				component: TheContactsPage,
				children: [
					{
						path: '',
						name: 'contacts',
						component: NoopRouteComponent,
					},
					{
						path: 'users',
						name: 'users',
						component: NoopRouteComponent,
					},
				],
			},
			{
				path: '/history',
				component: TheHistoryPage,
				children: [
					{
						path: '',
						name: HistoryPageTab.Calls,
						component: NoopRouteComponent,
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

	router.beforeEach(
		createAuthGuard({
			onUnauthorized,
		}),
	);

	beforeEach.forEach((guard) => {
		router.beforeEach(guard);
	});

	return router;
};
