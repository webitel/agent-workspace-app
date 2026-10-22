import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { HistoryPageTab } from '../../pages/modules/history/enums/HistoryPageTab.enum';
import HistorySidebarPanel from '../modules/history/history-sidebar-panel.vue';
import type { SidebarContent } from '../types/SidebarContent.types';

const contentByRoute: Partial<Record<string, SidebarContent>> = {
	[HistoryPageTab.Calls]: {
		component: HistorySidebarPanel,
	},
};

export function useSidebarContent() {
	const route = useRoute();

	const content = computed<SidebarContent | null>(() => {
		const { name } = route;
		if (typeof name !== 'string') return null;
		return contentByRoute[name] ?? null;
	});

	return {
		content,
	};
}
