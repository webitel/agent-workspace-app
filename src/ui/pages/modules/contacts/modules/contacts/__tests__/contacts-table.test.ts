import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

import { useSidebarSelectionStore } from '../../../../../../sidebar/store/sidebar-selection';
import ContactsTable from '../contacts-table.vue';
import type { useContactsDataListStore } from '../store/contacts';

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
const createStore = (dataList: WebitelContactsContact[]) =>
	reactive({
		dataList: ref(dataList),
		shownHeaders: ref([
			{
				value: 'name',
			},
		]),
		next: ref(false),
		initialize: vi.fn(() => Promise.resolve()),
		appendToDataList: vi.fn(),
		updateSort: vi.fn(),
		columnResize: vi.fn(),
		columnReorder: vi.fn(),
	}) as unknown as ReturnType<typeof useContactsDataListStore>;

const stubs = {
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

const contact: WebitelContactsContact = {
	id: '1',
	name: {
		commonName: 'John Doe',
	},
};

const mountTable = () =>
	mount(ContactsTable, {
		props: {
			store: createStore([
				contact,
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

describe('contacts-table', () => {
	let wrapper: ReturnType<typeof mountTable>;

	beforeEach(() => {
		wrapper = mountTable();
	});

	it('shows the contact name as a clickable cell', () => {
		expect(nameCellOf(wrapper).props()).toEqual({
			name: 'John Doe',
			clickable: true,
		});
	});

	it('selects the contact on name click', () => {
		nameCellOf(wrapper).vm.$emit('click');

		expect(useSidebarSelectionStore().selectContact).toHaveBeenCalledWith('1');
	});
});
