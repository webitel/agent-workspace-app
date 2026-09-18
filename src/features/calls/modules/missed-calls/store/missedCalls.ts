import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue';
import type { MissedCallRow } from '../types/MissedCall.types';
import type { MissedCallsColumnHeader } from '../types/MissedCallsTable.types';
import { MISSED_CALLS_SORT } from '../types/MissedCallsTable.types';
import {
	getMissedCalls,
	redialMissedCall,
} from '../api/missedCallsAPI';
import { mapHistoryCallToRow } from '../scripts/mapHistoryCallToRow';

const INITIAL_HEADERS: MissedCallsColumnHeader[] = [
	{
		value: 'name',
		locale: 'ui.pages.calls.missed.columns.name',
		field: 'contact.name',
		sort: MISSED_CALLS_SORT.NONE,
		width: '240px',
	},
	{
		value: 'phoneNumber',
		locale: 'ui.pages.calls.missed.columns.phoneNumber',
		width: '160px',
	},
	{
		value: 'createdAt',
		locale: 'ui.pages.calls.missed.columns.dateTime',
		field: 'created_at',
		sort: MISSED_CALLS_SORT.NONE,
		width: '180px',
	},
	{
		value: 'duration',
		locale: 'ui.pages.calls.missed.columns.totalDuration',
		field: 'duration',
		sort: MISSED_CALLS_SORT.NONE,
		width: '140px',
	},
	{
		value: 'queueName',
		locale: 'ui.pages.calls.missed.columns.queue',
		field: 'queue.name',
		sort: MISSED_CALLS_SORT.NONE,
		width: '160px',
	},
];

export const useMissedCallsStore = defineStore('missedCalls', () => {
	const rows = ref<MissedCallRow[]>([]);
	const headers = ref<MissedCallsColumnHeader[]>(INITIAL_HEADERS);
	const page = ref(1);
	const hasMore = ref(true);
	const search = ref('');
	const loading = ref(false);

	async function fetchPage() {
		loading.value = true;
		try {
			const { items, next } = await getMissedCalls({
				page: page.value,
				sort: () => (headers.value), // TODO SORT
				search: search.value || undefined,
			});
			rows.value = [
				...rows.value,
				...items.map(mapHistoryCallToRow),
			];
			hasMore.value = next;
		} finally {
			loading.value = false;
		}
	}

	async function initialize() {
		page.value = 1;
		rows.value = [];
		hasMore.value = true;
		await fetchPage();
	}

	async function loadMore() {
		if (loading.value || !hasMore.value) return;
		page.value += 1;
		await fetchPage();
	}

	async function applySort(
		column: MissedCallsColumnHeader,
		nextSort: MissedCallsColumnHeader['sort'],
	) {

		// TODO SORT
		await initialize();
	}

	async function setSearch(query: string) {
		search.value = query;
		await initialize();
	}

	async function redial(callId: string) {
		await redialMissedCall(callId);
	}

	return {
		rows,
		headers,
		hasMore,
		search,
		loading,

		initialize,
		loadMore,
		applySort,
		setSearch,
		redial,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useMissedCallsStore, import.meta.hot));
}
