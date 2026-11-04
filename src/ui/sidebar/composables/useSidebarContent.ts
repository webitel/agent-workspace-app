import { type ComputedRef, computed } from 'vue';
import { useRoute } from 'vue-router';
import { CallsRouteName } from '../../pages/modules/calls/enums/CallsRouteName.enum';
import { ContactsPageTab } from '../../pages/modules/contacts/enums/ContactsPageTab.enum';
import { HistoryPageTab } from '../../pages/modules/history/enums/HistoryPageTab.enum';
import TheCallPanel from '../modules/call/the-call-panel.vue';
import TheContactsPanel from '../modules/contacts/the-contacts-panel.vue';
import TheHistoryPanel from '../modules/history/the-history-panel.vue';
import type { SidebarContent } from '../types/SidebarContent.types';

const sidebarContentByRouteName: Partial<Record<string, SidebarContent>> = {
	[HistoryPageTab.Calls]: {
		component: TheHistoryPanel,
	},
	[ContactsPageTab.Contacts]: {
		component: TheContactsPanel,
	},
	[CallsRouteName.CallWindow]: {
		component: TheCallPanel,
	},
};

export function useSidebarContent(): {
	content: ComputedRef<SidebarContent | null>;
} {
	const route = useRoute();

	const content = computed<SidebarContent | null>(() => {
		const { name } = route;
		if (typeof name !== 'string') return null;
		return sidebarContentByRouteName[name] ?? null;
	});

	return {
		content,
	};
}
