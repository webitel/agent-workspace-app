import { flushPromises, mount } from '@vue/test-utils';
import { EmailsAPI, PhonesAPI } from '@webitel/api-services/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/api-services/api', () => ({
	PhonesAPI: {
		add: vi.fn(),
	},
	EmailsAPI: {
		add: vi.fn(),
	},
	CommunicationsAPI: {
		getLookup: vi.fn(),
	},
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtInputText: {
		name: 'WtInputText',
		props: [
			'modelValue',
			'label',
			'placeholder',
			'v',
		],
		emits: [
			'update:modelValue',
		],
		template: '<input class="wt-input-text-stub" />',
	},
	WtSingleSelect: {
		name: 'WtSingleSelect',
		props: [
			'modelValue',
			'label',
			'searchMethod',
		],
		emits: [
			'update:modelValue',
		],
		template: '<div class="wt-single-select-stub" />',
	},
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
			'<button :class="\'button-\' + icon" @click="$emit(\'click\')" />',
	},
}));

import ContactCardCommunicationAddForm from '../contact-card-communication-add-form.vue';

const workType = {
	id: '7',
	name: 'Work',
};

const mountForm = (
	props: Partial<{
		tab: 'phones' | 'emails';
		isFirst: boolean;
	}> = {},
) =>
	mount(ContactCardCommunicationAddForm, {
		props: {
			tab: 'phones',
			contactId: '15',
			isFirst: false,
			...props,
		},
	});

type Wrapper = ReturnType<typeof mountForm>;

const inputOf = (wrapper: Wrapper) =>
	wrapper.findComponent({
		name: 'WtInputText',
	});
const selectOf = (wrapper: Wrapper) =>
	wrapper.findComponent({
		name: 'WtSingleSelect',
	});
const saveButtonOf = (wrapper: Wrapper) =>
	wrapper
		.findAllComponents({
			name: 'WtButton',
		})
		.find((button) => button.props('icon') === 'tick');
const cancelButtonOf = (wrapper: Wrapper) =>
	wrapper
		.findAllComponents({
			name: 'WtButton',
		})
		.find((button) => button.props('icon') === 'close');

const fill = async (wrapper: Wrapper, value: string, type = workType) => {
	inputOf(wrapper).vm.$emit('update:modelValue', value);
	selectOf(wrapper).vm.$emit('update:modelValue', type);
	await wrapper.vm.$nextTick();
};

describe('ContactCardCommunicationAddForm', () => {
	beforeEach(() => {
		vi.mocked(PhonesAPI.add).mockReset();
		vi.mocked(EmailsAPI.add).mockReset();
	});

	it('asks for a phone number and a communication type on Phones', () => {
		const wrapper = mountForm();

		expect(inputOf(wrapper).props('label')).toBe('ui.reusable.phoneNumber');
		expect(selectOf(wrapper).props('label')).toBe('objects.communicationType');
	});

	it('asks for an email on Emails', () => {
		const wrapper = mountForm({
			tab: 'emails',
		});

		expect(inputOf(wrapper).props('label')).toBe('vocabulary.emails');
	});

	it('puts cancel before save', () => {
		const wrapper = mountForm();

		expect(
			wrapper
				.findAllComponents({
					name: 'WtButton',
				})
				.map((button) => button.props('icon')),
		).toEqual([
			'close',
			'tick',
		]);
	});

	it('keeps save disabled until both the value and the type are filled', async () => {
		const wrapper = mountForm();
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);

		inputOf(wrapper).vm.$emit('update:modelValue', '380991358573');
		await wrapper.vm.$nextTick();
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);

		selectOf(wrapper).vm.$emit('update:modelValue', workType);
		await wrapper.vm.$nextTick();
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(false);
	});

	it('marks a malformed email and keeps save disabled', async () => {
		const wrapper = mountForm({
			tab: 'emails',
		});

		await fill(wrapper, 'agent@');

		expect(inputOf(wrapper).props('v')).toMatchObject({
			$error: true,
			email: {
				$invalid: true,
			},
		});
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);
	});

	it('saves the record and reports it', async () => {
		vi.mocked(PhonesAPI.add).mockResolvedValueOnce({});
		const wrapper = mountForm({
			isFirst: true,
		});

		await fill(wrapper, '380991358573');
		await saveButtonOf(wrapper)?.trigger('click');
		await flushPromises();

		expect(PhonesAPI.add).toHaveBeenCalledWith({
			parentId: '15',
			itemInstance: {
				number: '380991358573',
				type: workType,
				primary: true,
			},
		});
		expect(wrapper.emitted('saved')).toHaveLength(1);
	});

	it('blocks a second save while the first is in flight', async () => {
		let resolve!: (value: unknown) => void;
		vi.mocked(PhonesAPI.add).mockReturnValueOnce(
			new Promise((res) => {
				resolve = res;
			}),
		);
		const wrapper = mountForm();

		await fill(wrapper, '380991358573');
		await saveButtonOf(wrapper)?.trigger('click');

		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);
		await saveButtonOf(wrapper)?.trigger('click');
		expect(PhonesAPI.add).toHaveBeenCalledTimes(1);

		resolve({});
		await flushPromises();
		expect(wrapper.emitted('saved')).toHaveLength(1);
	});

	it('keeps what was typed when saving fails', async () => {
		vi.mocked(PhonesAPI.add).mockRejectedValueOnce(new Error('fail'));
		const wrapper = mountForm();

		await fill(wrapper, '380991358573');
		await saveButtonOf(wrapper)?.trigger('click');
		await flushPromises();

		expect(wrapper.emitted('saved')).toBeUndefined();
		expect(inputOf(wrapper).props('modelValue')).toBe('380991358573');
		expect(selectOf(wrapper).props('modelValue')).toEqual(workType);
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(false);
	});

	it('cancels without saving', async () => {
		const wrapper = mountForm();

		await fill(wrapper, '380991358573');
		await cancelButtonOf(wrapper)?.trigger('click');

		expect(wrapper.emitted('cancel')).toHaveLength(1);
		expect(PhonesAPI.add).not.toHaveBeenCalled();
	});
});
