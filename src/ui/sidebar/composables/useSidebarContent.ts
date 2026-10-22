import { type ComputedRef, computed } from 'vue';
import { useRoute } from 'vue-router';
import { HistoryPageTab } from '../../pages/modules/history/enums/HistoryPageTab.enum';
import HistorySidebarPanel from '../modules/history/history-sidebar-panel.vue';
import type { SidebarContent } from '../types/SidebarContent.types';

const sidebarContentByRouteName: Partial<Record<string, SidebarContent>> = {
	[HistoryPageTab.Calls]: {
		component: HistorySidebarPanel,
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
