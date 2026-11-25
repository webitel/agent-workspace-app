import { flushPromises, mount } from '@vue/test-utils';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// the real store pulls in the socket client and the i18n singleton
const outboundCallAttemptsStore = {
	start: vi.fn(),
};

vi.mock('../../../../../features/calls/store/outboundCallAttempts', () => ({
	useOutboundCallAttemptsStore: () => outboundCallAttemptsStore,
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		props: [
			'icon',
			'disabled',
		],
		emits: [
			'click',
		],
		template:
			'<button :class="\'button-\' + icon" :disabled="disabled" @click="$emit(\'click\')" />',
	},
	WtTabs: {
		name: 'WtTabs',
		props: [
			'current',
			'tabs',
		],
		emits: [
			'change',
		],
		template: '<nav class="wt-tabs-stub" />',
	},
}));

// the form is covered on its own; here it only has to show up and hand over
vi.mock('../contact-card-communication-add-form.vue', () => ({
	default: {
		name: 'ContactCardCommunicationAddForm',
		props: [
			'tab',
			'isSaving',
		],
		emits: [
			'submit',
			'cancel',
		],
		template: '<form class="add-form-stub" />',
	},
}));

vi.mock('../scripts/contactCommunicationAdd', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	addCommunication: vi.fn(),
}));

import PhoneCallButton from '../../../../components/phone-call-button/phone-call-button.vue';
import ContactCardCommunication from '../contact-card-communication.vue';
import ContactCardCommunicationItem from '../contact-card-communication-item.vue';
import { addCommunication } from '../scripts/contactCommunicationAdd';

const contact: WebitelContactsContact = {
	id: '15',
	phones: {
		data: [
			{
				id: '403',
				number: '380991358573',
			},
			{
				id: '404',
				number: '380671112233',
			},
		],
	},
	imclients: {
		data: [
			{
				id: '1316',
				protocol: 'telegram',
				user: {
					name: 'Polina polinasukhorukova',
				},
			},
		],
	},
	emails: {
		data: [
			{
				id: '225',
				email: 'polina.agent@gmail.com',
			},
		],
	},
};

const mountSection = (value: WebitelContactsContact = contact) =>
	mount(ContactCardCommunication, {
		props: {
			contact: value,
		},
		global: {
			stubs: {
				'wt-icon': true,
			},
		},
	});

type Wrapper = ReturnType<typeof mountSection>;

const tabsOf = (wrapper: Wrapper) =>
	wrapper.findComponent({
		name: 'WtTabs',
	});

const itemsOf = (wrapper: Wrapper) =>
	wrapper
		.findAllComponents(ContactCardCommunicationItem)
		.map((item) => item.props('item'));

const callNumbersOf = (wrapper: Wrapper) =>
	wrapper
		.findAllComponents(PhoneCallButton)
		.map((button) => button.props('number'));

const selectTab = async (wrapper: Wrapper, value: string) => {
	const tab = (
		tabsOf(wrapper).props('tabs') as {
			value: string;
		}[]
	).find((item) => item.value === value);
	tabsOf(wrapper).vm.$emit('change', tab);
	await wrapper.vm.$nextTick();
};

describe('ContactCardCommunication', () => {
	it('renders the title and the Phones / Messaging / Emails tabs', () => {
		const wrapper = mountSection();

		expect(wrapper.text()).toContain('ui.sidebar.contact.communicationOptions');
		expect(tabsOf(wrapper).props('tabs')).toEqual([
			{
				value: 'phones',
				text: 'vocabulary.phones',
			},
			{
				value: 'messaging',
				text: 'vocabulary.messaging',
			},
			{
				value: 'emails',
				text: 'vocabulary.emails',
			},
		]);
	});

	it('opens on Phones', () => {
		const wrapper = mountSection();

		expect(tabsOf(wrapper).props('current')).toEqual({
			value: 'phones',
			text: 'vocabulary.phones',
		});
		expect(itemsOf(wrapper)).toEqual([
			{
				id: '403',
				value: '380991358573',
				icon: 'call--filled',
			},
			{
				id: '404',
				value: '380671112233',
				icon: 'call--filled',
			},
		]);
	});

	it('puts a call button next to every number on Phones', () => {
		const wrapper = mountSection();

		expect(callNumbersOf(wrapper)).toEqual([
			'380991358573',
			'380671112233',
		]);
	});

	it('calls the number of the clicked row', async () => {
		outboundCallAttemptsStore.start.mockReset();
		const wrapper = mountSection();

		await wrapper.findAll('.phone-call-button')[1].trigger('click');

		expect(outboundCallAttemptsStore.start).toHaveBeenCalledWith(
			'380671112233',
		);
	});

	it('disables only the clicked row while its call is starting', async () => {
		let finishCall: () => void = () => {};
		outboundCallAttemptsStore.start.mockReturnValue(
			new Promise<void>((resolve) => {
				finishCall = resolve;
			}),
		);
		const wrapper = mountSection();
		const buttons = () => wrapper.findAll('.phone-call-button');

		await buttons()[1].trigger('click');
		expect(buttons()[0].attributes('disabled')).toBeUndefined();
		expect(buttons()[1].attributes('disabled')).toBeDefined();

		finishCall();
		await flushPromises();
		expect(buttons()[1].attributes('disabled')).toBeUndefined();
	});

	it('shows no call button on Messaging and Emails', async () => {
		const wrapper = mountSection();

		await selectTab(wrapper, 'messaging');
		expect(callNumbersOf(wrapper)).toEqual([]);

		await selectTab(wrapper, 'emails');
		expect(callNumbersOf(wrapper)).toEqual([]);
	});

	it('shows the messengers on Messaging', async () => {
		const wrapper = mountSection();

		await selectTab(wrapper, 'messaging');

		expect(tabsOf(wrapper).props('current')).toEqual({
			value: 'messaging',
			text: 'vocabulary.messaging',
		});
		expect(itemsOf(wrapper)).toEqual([
			{
				id: '1316',
				value: 'Polina polinasukhorukova',
				icon: 'telegram-bot',
			},
		]);
	});

	it('shows the emails on Emails', async () => {
		const wrapper = mountSection();

		await selectTab(wrapper, 'emails');

		expect(itemsOf(wrapper)).toEqual([
			{
				id: '225',
				value: 'polina.agent@gmail.com',
				icon: 'ws-navigation-email',
			},
		]);
	});

	it('renders an empty list for a tab without records', () => {
		const wrapper = mountSection({});

		expect(wrapper.find('ul').exists()).toBe(true);
		expect(itemsOf(wrapper)).toEqual([]);
	});

	describe('adding a record (AC_07.07.08, AC_07.07.09)', () => {
		const addButtonOf = (wrapper: Wrapper) => wrapper.find('.button-plus');
		const formOf = (wrapper: Wrapper) =>
			wrapper.findComponent({
				name: 'ContactCardCommunicationAddForm',
			});
		const openForm = async (wrapper: Wrapper) => {
			await addButtonOf(wrapper).trigger('click');
		};

		it('offers adding on Phones and Emails, not on Messaging', async () => {
			const isHidden = (wrapper: Wrapper) => {
				const button = addButtonOf(wrapper);
				const hidden = button.classes(
					'contact-card-communication__add--hidden',
				);
				// an invisible button must not take clicks or focus either
				expect(button.attributes('inert') !== undefined).toBe(hidden);
				return hidden;
			};
			const wrapper = mountSection();
			expect(isHidden(wrapper)).toBe(false);

			await selectTab(wrapper, 'messaging');
			// kept in place so the tab row does not change height
			expect(addButtonOf(wrapper).exists()).toBe(true);
			expect(isHidden(wrapper)).toBe(true);

			await selectTab(wrapper, 'emails');
			expect(isHidden(wrapper)).toBe(false);
		});

		it('opens the form for the current tab and contact', async () => {
			const wrapper = mountSection();
			expect(formOf(wrapper).exists()).toBe(false);

			await openForm(wrapper);

			expect(formOf(wrapper).props()).toEqual({
				tab: 'phones',
				isSaving: false,
			});
			// the list stays below the form
			expect(itemsOf(wrapper)).toHaveLength(contact.phones?.data?.length ?? 0);
		});

		it('keeps one form open on a second click of add', async () => {
			const wrapper = mountSection();

			await openForm(wrapper);
			await openForm(wrapper);

			expect(
				wrapper.findAllComponents({
					name: 'ContactCardCommunicationAddForm',
				}),
			).toHaveLength(1);
		});

		it('closes the form on cancel', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			formOf(wrapper).vm.$emit('cancel');
			await wrapper.vm.$nextTick();

			expect(formOf(wrapper).exists()).toBe(false);
			expect(wrapper.emitted('changed')).toBeUndefined();
		});

		describe('saving', () => {
			const record = {
				number: '380501234567',
				type: {
					id: '7',
					name: 'Work',
				},
			};

			const deferAdd = () => {
				let resolve!: () => void;
				let reject!: (reason?: unknown) => void;
				vi.mocked(addCommunication).mockReturnValueOnce(
					new Promise((res, rej) => {
						resolve = () => res(undefined);
						reject = rej;
					}),
				);
				return {
					resolve,
					reject,
				};
			};

			const submit = async (wrapper: Wrapper) => {
				formOf(wrapper).vm.$emit('submit', record);
				await wrapper.vm.$nextTick();
			};

			beforeEach(() => {
				vi.mocked(addCommunication).mockReset();
			});

			it('adds the record to the shown contact on its tab', async () => {
				vi.mocked(addCommunication).mockResolvedValueOnce(undefined);
				const wrapper = mountSection();
				await openForm(wrapper);

				await submit(wrapper);

				expect(addCommunication).toHaveBeenCalledWith('phones', '15', record, {
					primary: false,
				});
			});

			it('makes the first record of a tab primary', async () => {
				vi.mocked(addCommunication).mockResolvedValueOnce(undefined);
				const wrapper = mountSection({
					id: '15',
				});
				await openForm(wrapper);

				await submit(wrapper);

				expect(addCommunication).toHaveBeenCalledWith('phones', '15', record, {
					primary: true,
				});
			});

			it('marks the form saving until the request settles', async () => {
				const request = deferAdd();
				const wrapper = mountSection();
				await openForm(wrapper);

				await submit(wrapper);
				expect(formOf(wrapper).props('isSaving')).toBe(true);

				request.resolve();
				await flushPromises();
				expect(wrapper.emitted('changed')).toHaveLength(1);
			});

			it('closes the form and reports the change once saved', async () => {
				vi.mocked(addCommunication).mockResolvedValueOnce(undefined);
				const wrapper = mountSection();
				await openForm(wrapper);

				await submit(wrapper);
				await flushPromises();

				expect(formOf(wrapper).exists()).toBe(false);
				expect(wrapper.emitted('changed')).toHaveLength(1);
			});

			it('still reports the change when the agent switched tabs mid-save', async () => {
				const request = deferAdd();
				const wrapper = mountSection();
				await openForm(wrapper);
				await submit(wrapper);

				await selectTab(wrapper, 'emails');
				expect(formOf(wrapper).exists()).toBe(false);

				request.resolve();
				await flushPromises();

				expect(wrapper.emitted('changed')).toHaveLength(1);
			});

			it('leaves a form opened on another tab mid-save alone', async () => {
				const request = deferAdd();
				const wrapper = mountSection();
				await openForm(wrapper);
				await submit(wrapper);

				await selectTab(wrapper, 'emails');
				await openForm(wrapper);
				expect(formOf(wrapper).props()).toEqual({
					tab: 'emails',
					isSaving: false,
				});

				request.resolve();
				await flushPromises();

				expect(formOf(wrapper).exists()).toBe(true);
			});

			it('reports nothing when another contact was shown mid-save', async () => {
				const request = deferAdd();
				const wrapper = mountSection();
				await openForm(wrapper);
				await submit(wrapper);

				await wrapper.setProps({
					contact: {
						...contact,
						id: '16',
					},
				});
				request.resolve();
				await flushPromises();

				expect(wrapper.emitted('changed')).toBeUndefined();
			});

			it('keeps the form open and reports nothing when saving fails', async () => {
				const request = deferAdd();
				const wrapper = mountSection();
				await openForm(wrapper);
				await submit(wrapper);

				request.reject(new Error('fail'));
				await flushPromises();

				expect(formOf(wrapper).exists()).toBe(true);
				expect(formOf(wrapper).props('isSaving')).toBe(false);
				expect(wrapper.emitted('changed')).toBeUndefined();
			});
		});

		it('drops the form when the agent switches tabs', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			await selectTab(wrapper, 'emails');

			expect(formOf(wrapper).exists()).toBe(false);
		});

		it('drops the form when another contact is shown', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			await wrapper.setProps({
				contact: {
					...contact,
					id: '16',
				},
			});

			expect(formOf(wrapper).exists()).toBe(false);
		});

		it('keeps the form when the same contact is reloaded', async () => {
			const wrapper = mountSection();
			await openForm(wrapper);

			await wrapper.setProps({
				contact: {
					...contact,
				},
			});

			expect(formOf(wrapper).exists()).toBe(true);
		});
	});
});
