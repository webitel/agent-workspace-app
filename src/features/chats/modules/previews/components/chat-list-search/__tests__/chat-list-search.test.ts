import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

const chatListStore = reactive({
	query: '',
	setQuery: vi.fn(),
});
vi.mock('../../../store/chat-list', () => ({
	useChatListStore: () => chatListStore,
}));

// the search bar is a heavy component of the ui-sdk; only its two events matter here
vi.mock('@webitel/ui-sdk/components', () => ({
	WtSearchBar: {
		name: 'WtSearchBar',
		props: [
			'value',
		],
		emits: [
			'input',
			'search',
		],
		template:
			'<input :value="value" @input="$emit(\'input\', $event.target.value)" @change="$emit(\'search\', $event.target.value)" />',
	},
}));

import ChatListSearch from '../chat-list-search.vue';

const mountSearch = () => mount(ChatListSearch);

describe('chat-list-search', () => {
	beforeEach(() => {
		chatListStore.query = '';
		chatListStore.setQuery.mockClear();
	});

	it('searches the list for what was typed once the search bar says so', async () => {
		const wrapper = mountSearch();
		const input = wrapper.find('input');

		await input.setValue('jane');
		await input.trigger('change');

		expect(chatListStore.setQuery).toHaveBeenCalledWith('jane');
	});

	// typing alone would search on every key; the bar's own debounce is what ends it
	it('does not search while the text is only being typed', async () => {
		const wrapper = mountSearch();

		await wrapper.find('input').trigger('input');

		expect(chatListStore.setQuery).not.toHaveBeenCalled();
	});

	it('starts from the query the list already holds', () => {
		chatListStore.query = 'jane';

		expect(mountSearch().find('input').element.value).toBe('jane');
	});
});
