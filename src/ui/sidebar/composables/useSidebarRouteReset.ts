import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSidebarSelectionStore } from '../store/sidebar-selection';
import { useWorkspaceSidebarStore } from '../store/workspace-sidebar';

/**
 * A new page means a new context, so the selection made on the previous one
 * is dropped and the panel closes. Query-only changes (filters, pagination)
 * keep the route name and leave both untouched.
 */
export function useSidebarRouteReset(): void {
	const route = useRoute();
	const { clearSelection } = useSidebarSelectionStore();
	const { close } = useWorkspaceSidebarStore();

	watch(
		() => route.name,
		() => {
			clearSelection();
			close();
		},
	);
}
