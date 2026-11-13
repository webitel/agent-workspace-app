import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import type { ApiUser } from '@webitel/api-services/gen/models';
import { describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

import { useOutboundCallAttemptsStore } from '../../../../../../../features/calls/store/outboundCallAttempts';
import { useSidebarSelectionStore } from '../../../../../../sidebar/store/sidebar-selection';
import type { useUsersDataListStore } from '../store/users';
import UsersTable from '../users-table.vue';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtTable: {
		name: 'WtTable',
		props: [
			'data',
			'headers',
		],
		template: `<table>
			<tr v-for="item in data" :key="item.id">
				<td v-for="header in headers">
					<slot :name="header.value" :item="item" />
				</td>
			</tr>
		</table>`,
	},
}));

/**
 * Stand-in for the ui-datalist table store: only the state and actions
 * the table reads, so the test covers our logic, not createTableStore
 */
const createStore = (dataList: ApiUser[]) =>
	reactive({
		dataList: ref(dataList),
		shownHeaders: ref([
			{
				value: 'name',
			},
			{
				value: 'extension',
			},
		]),
		next: ref(false),
		initialize: vi.fn(() => Promise.resolve()),
		appendToDataList: vi.fn(),
		updateSort: vi.fn(),
		columnResize: vi.fn(),
		columnReorder: vi.fn(),
	}) as unknown as ReturnType<typeof useUsersDataListStore>;

const stubs = {
	ContactPhonesCell: {
		name: 'ContactPhonesCell',
		props: [
			'phones',
		],
		emits: [
			'call',
		],
		template: '<div class="phones-cell" />',
	},
	UsernameTableCell: {
		name: 'UsernameTableCell',
		props: {
			name: String,
			clickable: Boolean,
		},
		emits: [
			'click',
		],
		template: '<div class="username-cell" />',
	},
};

const mountTable = (user: ApiUser) =>
	mount(UsersTable, {
		props: {
			store: createStore([
				user,
			]),
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs,
		},
	});

const nameCellOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'UsernameTableCell',
	});

const phonesCellOf = (wrapper: ReturnType<typeof mountTable>) =>
	wrapper.findComponent({
		name: 'ContactPhonesCell',
	});

describe('users-table', () => {
	it('shows the user name as a clickable cell', () => {
		const wrapper = mountTable({
			id: '1',
			name: 'John Doe',
		});

		expect(nameCellOf(wrapper).props()).toEqual({
			name: 'John Doe',
			clickable: true,
		});
	});

	it('opens the linked contact on name click', () => {
		const wrapper = mountTable({
			id: '1',
			name: 'John Doe',
			contact: {
				id: '10',
			},
		});

		nameCellOf(wrapper).vm.$emit('click');

		expect(
			useSidebarSelectionStore().selectContactOrUnknown,
		).toHaveBeenCalledWith('10');
	});

	it('opens an unknown contact when the user has no contact', () => {
		const wrapper = mountTable({
			id: '1',
			name: 'John Doe',
		});

		nameCellOf(wrapper).vm.$emit('click');

		expect(
			useSidebarSelectionStore().selectContactOrUnknown,
		).toHaveBeenCalledWith(undefined);
	});

	it('passes the user extension to the phones cell', () => {
		const wrapper = mountTable({
			id: '1',
			name: 'John Doe',
			extension: '101',
		});

		expect(phonesCellOf(wrapper).props('phones')).toEqual([
			{
				number: '101',
			},
		]);
	});

	it('passes no phones when the user has no extension', () => {
		const wrapper = mountTable({
			id: '1',
			name: 'John Doe',
		});

		expect(phonesCellOf(wrapper).props('phones')).toEqual([]);
	});

	it('starts an outbound attempt on the extension chosen in the phones cell', () => {
		const wrapper = mountTable({
			id: '1',
			name: 'John Doe',
			extension: '101',
		});

		phonesCellOf(wrapper).vm.$emit('call', '101');

		expect(useOutboundCallAttemptsStore().start).toHaveBeenCalledWith('101');
	});
});
