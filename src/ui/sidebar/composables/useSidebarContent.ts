import { type ComputedRef, computed } from 'vue';
import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router';
import { useCallsStore } from '../../../features/calls/store/calls';
import { CallsPageTab } from '../../pages/modules/calls/enums/CallsPageTab.enum';
import { CallsRouteName } from '../../pages/modules/calls/enums/CallsRouteName.enum';
import { ContactsPageTab } from '../../pages/modules/contacts/enums/ContactsPageTab.enum';
import { HistoryPageTab } from '../../pages/modules/history/enums/HistoryPageTab.enum';
import TheCallPanel from '../modules/call/the-call-panel.vue';
import TheContactsPanel from '../modules/contacts/the-contacts-panel.vue';
import TheHistoryPanel from '../modules/history/the-history-panel.vue';
import TheOfflineMemberPanel from '../modules/offline-member/the-offline-member-panel.vue';
import type { SidebarContent } from '../types/SidebarContent.types';

// What the sidebar shows on a route, or null when there is nothing to show
// (the call page whose call is already gone).
type SidebarContentResolver = (
	route: RouteLocationNormalizedLoaded,
) => SidebarContent | null;

const sidebarContentByRouteName: Partial<
	Record<string, SidebarContentResolver>
> = {
	[HistoryPageTab.Calls]: () => ({
		component: TheHistoryPanel,
	}),
	[ContactsPageTab.Contacts]: () => ({
		component: TheContactsPanel,
	}),
	[ContactsPageTab.Users]: () => ({
		component: TheContactsPanel,
	}),
	[CallsPageTab.Offline]: () => ({
		component: TheOfflineMemberPanel,
	}),
	[CallsRouteName.CallWindow]: (route) => {
		const call = useCallsStore().getCallById(route.params.callId as string);
		return call
			? {
					component: TheCallPanel,
					props: {
						call,
					},
				}
			: null;
	},
};

export function useSidebarContent(): {
	content: ComputedRef<SidebarContent | null>;
} {
	const route = useRoute();

	const content = computed<SidebarContent | null>(() => {
		const { name } = route;
		if (typeof name !== 'string') return null;
		return sidebarContentByRouteName[name]?.(route) ?? null;
	});

	return {
		content,
	};
}
