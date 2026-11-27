import { flushPromises, mount } from '@vue/test-utils';
import { CommunicationsAPI } from '@webitel/api-services/api';
import { describe, expect, it, vi } from 'vitest';

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
			'regleValidation',
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
		isSaving: boolean;
	}> = {},
) =>
	mount(ContactCardCommunicationAddForm, {
		props: {
			tab: 'phones',
			isSaving: false,
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
const buttonOf = (wrapper: Wrapper, icon: string) =>
	wrapper
		.findAllComponents({
			name: 'WtButton',
		})
		.find((button) => button.props('icon') === icon);
const saveButtonOf = (wrapper: Wrapper) => buttonOf(wrapper, 'tick');
const cancelButtonOf = (wrapper: Wrapper) => buttonOf(wrapper, 'close');

const fill = async (wrapper: Wrapper, value: string, type = workType) => {
	inputOf(wrapper).vm.$emit('update:modelValue', value);
	selectOf(wrapper).vm.$emit('update:modelValue', type);
	await flushPromises();
};

describe('ContactCardCommunicationAddForm', () => {
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

	it('offers the communication types of its tab channel', () => {
		const wrapper = mountForm({
			tab: 'emails',
		});

		selectOf(wrapper).props('searchMethod')({
			search: 'wo',
		});

		expect(CommunicationsAPI.getLookup).toHaveBeenCalledWith({
			search: 'wo',
			channel: 'Email',
		});
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
		await flushPromises();
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);

		selectOf(wrapper).vm.$emit('update:modelValue', workType);
		await flushPromises();
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(false);
	});

	it('marks a malformed email and keeps save disabled', async () => {
		const wrapper = mountForm({
			tab: 'emails',
		});

		await fill(wrapper, 'agent@');

		expect(inputOf(wrapper).props('regleValidation').$error).toBe(true);
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);
	});

	it('marks nothing before the agent types', () => {
		const wrapper = mountForm({
			tab: 'emails',
		});

		expect(inputOf(wrapper).props('regleValidation').$error).toBe(false);
	});

	it('accepts a well-formed email', async () => {
		const wrapper = mountForm({
			tab: 'emails',
		});

		await fill(wrapper, 'agent@webitel.com');

		expect(inputOf(wrapper).props('regleValidation').$error).toBe(false);
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(false);
	});

	it('hands over what was typed on save', async () => {
		const wrapper = mountForm();

		await fill(wrapper, '380991358573');
		await saveButtonOf(wrapper)?.trigger('click');

		expect(wrapper.emitted('submit')).toEqual([
			[
				{
					number: '380991358573',
					type: workType,
				},
			],
		]);
	});

	it('hands over nothing while invalid', async () => {
		const wrapper = mountForm();

		await fill(wrapper, '380991358573', null);
		await wrapper.find('form').trigger('submit');

		expect(wrapper.emitted('submit')).toBeUndefined();
	});

	it('blocks save while its record is being saved, keeping what was typed', async () => {
		const wrapper = mountForm();
		await fill(wrapper, '380991358573');

		await wrapper.setProps({
			isSaving: true,
		});
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(true);
		await saveButtonOf(wrapper)?.trigger('click');
		expect(wrapper.emitted('submit')).toBeUndefined();

		await wrapper.setProps({
			isSaving: false,
		});
		expect(inputOf(wrapper).props('modelValue')).toBe('380991358573');
		expect(selectOf(wrapper).props('modelValue')).toEqual(workType);
		expect(saveButtonOf(wrapper)?.props('disabled')).toBe(false);
	});

	it('cancels without handing anything over', async () => {
		const wrapper = mountForm();

		await fill(wrapper, '380991358573');
		await cancelButtonOf(wrapper)?.trigger('click');

		expect(wrapper.emitted('cancel')).toHaveLength(1);
		expect(wrapper.emitted('submit')).toBeUndefined();
	});
});
