import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		props: [
			'color',
		],
		emits: [
			'click',
		],
		template: '<button @click="$emit(\'click\')"><slot /></button>',
	},
}));

vi.mock('../../../../../app/composables/useThemedImage', async () => {
	const { computed } = await import('vue');
	return {
		useThemedImage: ({ light }: { light: string }) => computed(() => light),
	};
});

import emptyFiltersLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-filters-light.svg';
import { ContactSearchMode } from '../../../../../features/calls/modules/contact/enums/ContactSearchMode.enum';
import ContactCard from '../contact-card.vue';
import ContactCardUnknown from '../contact-card-unknown.vue';
import ContactIdentification from '../contact-identification.vue';
import ContactPanelEmpty from '../contact-panel-empty.vue';
import ContactSearch from '../contact-search.vue';
import FoundContactsNavigator from '../found-contacts-navigator.vue';

const WtLoaderStub = {
	name: 'WtLoader',
	template: '<div class="wt-loader-stub" />',
};

type BlockProps = {
	contactIds: string[];
	isLoading?: boolean;
	canSelect?: boolean;
	canSearch?: boolean;
	isSearchActive?: boolean;
};

const mountBlock = (props: BlockProps, slots: Record<string, string> = {}) =>
	mount(ContactIdentification, {
		props,
		slots,
		global: {
			stubs: {
				WtLoader: WtLoaderStub,
				ContactCard: true,
				ContactPanelEmpty: true,
				ContactCardUnknown: true,
				ContactSearch: true,
				FoundContactsNavigator: true,
			},
		},
	});

const findCard = (wrapper: ReturnType<typeof mountBlock>) =>
	wrapper.findComponent(ContactCard);

const findSwitcher = (wrapper: ReturnType<typeof mountBlock>) =>
	wrapper.findComponent(FoundContactsNavigator);

const findSelectButton = (wrapper: ReturnType<typeof mountBlock>) =>
	wrapper.findComponent({
		name: 'WtButton',
	});

const severalFound = (overrides: Partial<BlockProps> = {}) =>
	mountBlock({
		contactIds: [
			'101',
			'102',
			'103',
		],
		...overrides,
	});

describe('contact-identification', () => {
	it('shows the loader while identifying, whatever is already found', () => {
		const wrapper = mountBlock({
			contactIds: [
				'101',
			],
			isLoading: true,
		});

		expect(wrapper.findComponent(WtLoaderStub).exists()).toBe(true);
		expect(findCard(wrapper).exists()).toBe(false);
	});

	it('shows the unknown contact when no contact matches', () => {
		const wrapper = mountBlock({
			contactIds: [],
		});

		expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(true);
		expect(wrapper.findComponent(ContactPanelEmpty).exists()).toBe(false);
	});

	describe('search', () => {
		it('shows the search only when the agent can search', async () => {
			const wrapper = mountBlock({
				contactIds: [],
			});

			expect(wrapper.findComponent(ContactSearch).exists()).toBe(false);

			await wrapper.setProps({
				canSearch: true,
			});

			expect(wrapper.findComponent(ContactSearch).exists()).toBe(true);
		});

		it('passes the search up', () => {
			const wrapper = mountBlock({
				contactIds: [],
				canSearch: true,
			});
			const request = {
				query: 'sarah',
				searchMode: ContactSearchMode.Destination,
			};

			wrapper.findComponent(ContactSearch).vm.$emit('search', request);

			expect(wrapper.emitted('search')).toEqual([
				[
					request,
				],
			]);
		});

		it('clears the typed query once the search ends', async () => {
			const wrapper = mountBlock({
				contactIds: [],
				canSearch: true,
				isSearchActive: true,
			});
			wrapper.findComponent(ContactSearch).vm.$emit('update:query', 'sarah');
			await nextTick();
			expect(wrapper.findComponent(ContactSearch).props('query')).toBe('sarah');

			await wrapper.setProps({
				isSearchActive: false,
			});

			expect(wrapper.findComponent(ContactSearch).props('query')).toBe('');
		});

		it('shows "no results" instead of the unknown contact when a search found nothing', () => {
			const wrapper = mountBlock({
				contactIds: [],
				canSearch: true,
				isSearchActive: true,
			});

			expect(wrapper.findComponent(ContactPanelEmpty).props('title')).toBe(
				'ui.sidebar.contact.search.noResults',
			);
			expect(wrapper.findComponent(ContactPanelEmpty).props('image')).toBe(
				emptyFiltersLight,
			);
			expect(wrapper.findComponent(ContactCardUnknown).exists()).toBe(false);
		});

		it('shows what a search found like any other result', () => {
			const wrapper = mountBlock({
				contactIds: [
					'101',
					'102',
				],
				canSearch: true,
				isSearchActive: true,
			});

			expect(findCard(wrapper).props('contactId')).toBe('101');
			expect(findSwitcher(wrapper).props('count')).toBe(2);
		});

		it('offers cancel beside the parent actions only after a search', async () => {
			const wrapper = mountBlock(
				{
					contactIds: [],
					canSearch: true,
				},
				{
					actions: '<button class="parent-action" />',
				},
			);
			const buttons = () =>
				wrapper.find('.contact-identification__actions').findAll('button');

			expect(buttons()).toHaveLength(1);

			await wrapper.setProps({
				isSearchActive: true,
			});

			expect(buttons().map((button) => button.text())).toEqual([
				'',
				'reusable.cancel',
			]);
			await buttons()[1].trigger('click');
			expect(wrapper.emitted('cancelSearch')).toHaveLength(1);
		});
	});

	it('shows the card of the only match, without the switcher', () => {
		const wrapper = mountBlock({
			contactIds: [
				'101',
			],
			canSelect: true,
		});

		expect(findCard(wrapper).props('contactId')).toBe('101');
		expect(findSwitcher(wrapper).exists()).toBe(false);
		expect(findSelectButton(wrapper).exists()).toBe(false);
	});

	it('hides the parent actions while identifying', () => {
		const wrapper = mountBlock(
			{
				contactIds: [],
				isLoading: true,
			},
			{
				actions: '<button class="parent-action" />',
			},
		);

		expect(wrapper.find('.parent-action').exists()).toBe(false);
	});

	it('shows the parent actions in every result', async () => {
		const wrapper = mountBlock(
			{
				contactIds: [],
				isLoading: true,
			},
			{
				actions: '<button class="parent-action" />',
			},
		);

		for (const contactIds of [
			[],
			[
				'101',
			],
			[
				'101',
				'102',
			],
		]) {
			await wrapper.setProps({
				contactIds,
				isLoading: false,
			});
			expect(wrapper.find('.parent-action').exists()).toBe(true);
		}
	});

	describe('several matches', () => {
		it('shows the first contact by default', () => {
			const wrapper = severalFound();

			expect(findCard(wrapper).props('contactId')).toBe('101');
			expect(findSwitcher(wrapper).props()).toEqual({
				position: 1,
				count: 3,
			});
		});

		it('switches the shown contact forward and back', async () => {
			const wrapper = severalFound();

			findSwitcher(wrapper).vm.$emit('next');
			await nextTick();
			findSwitcher(wrapper).vm.$emit('next');
			await nextTick();

			expect(findCard(wrapper).props('contactId')).toBe('103');
			expect(findSwitcher(wrapper).props('position')).toBe(3);

			findSwitcher(wrapper).vm.$emit('prev');
			await nextTick();

			expect(findCard(wrapper).props('contactId')).toBe('102');
			expect(findSwitcher(wrapper).props('position')).toBe(2);
		});

		it('starts from the first contact of a new result', async () => {
			const wrapper = severalFound();
			findSwitcher(wrapper).vm.$emit('next');
			await nextTick();

			await wrapper.setProps({
				contactIds: [
					'201',
					'202',
				],
			});

			expect(findCard(wrapper).props('contactId')).toBe('201');
			expect(findSwitcher(wrapper).props()).toEqual({
				position: 1,
				count: 2,
			});
		});

		it('emits select with the shown contact', async () => {
			const wrapper = severalFound({
				canSelect: true,
			});
			findSwitcher(wrapper).vm.$emit('next');
			await nextTick();

			await findSelectButton(wrapper).trigger('click');

			expect(findSelectButton(wrapper).text()).toBe('ui.reusable.select');
			expect(wrapper.emitted('select')).toEqual([
				[
					'102',
				],
			]);
		});

		it('puts select after the parent actions, in one row', () => {
			const wrapper = mountBlock(
				{
					contactIds: [
						'101',
						'102',
					],
					canSelect: true,
				},
				{
					actions: '<button class="parent-action" />',
				},
			);

			const row = wrapper.find('.contact-identification__actions');
			const buttons = row.findAll('button');
			expect(buttons).toHaveLength(2);
			expect(buttons[0].classes()).toContain('parent-action');
			expect(buttons[1].text()).toBe('ui.reusable.select');
		});

		it('offers no select without canSelect', () => {
			const wrapper = severalFound();

			expect(findSelectButton(wrapper).exists()).toBe(false);
		});
	});
});
