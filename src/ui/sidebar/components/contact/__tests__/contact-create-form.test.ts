import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@webitel/api-services/api', () => ({
	CalendarsAPI: {
		getTimezonesLookup: vi.fn(),
	},
	LabelsAPI: {
		getLookup: vi.fn(),
	},
	UsersAPI: {
		getLookup: vi.fn(),
	},
}));

const { fieldStub } = vi.hoisted(() => ({
	fieldStub: (name: string) => ({
		name,
		props: {
			modelValue: null,
			label: String,
			placeholder: String,
			regleValidation: Object,
			searchMethod: Function,
			allowCustomValues: Boolean,
		},
		emits: [
			'update:modelValue',
		],
		template: `<div class="${name}-stub" />`,
	}),
}));

vi.mock('@webitel/ui-sdk/components', () => ({
	WtInputText: fieldStub('WtInputText'),
	WtSingleSelect: fieldStub('WtSingleSelect'),
	WtMultiSelect: fieldStub('WtMultiSelect'),
	WtTextarea: fieldStub('WtTextarea'),
	WtButton: {
		name: 'WtButton',
		props: [
			'disabled',
			'loading',
			'color',
		],
		emits: [
			'click',
		],
		template: '<button @click="$emit(\'click\')"><slot /></button>',
	},
}));

import { useUserinfoStore } from '../../../../../features/userinfo/stores/userinfoStore';
import ContactCreateForm from '../contact-create-form.vue';

const mountForm = (isSaving = false) =>
	mount(ContactCreateForm, {
		props: {
			isSaving,
		},
	});

type Wrapper = ReturnType<typeof mountForm>;

const fieldLabeled = (wrapper: Wrapper, label: string) => {
	const field = [
		...wrapper.findAllComponents({
			name: 'WtInputText',
		}),
		...wrapper.findAllComponents({
			name: 'WtSingleSelect',
		}),
		...wrapper.findAllComponents({
			name: 'WtMultiSelect',
		}),
		...wrapper.findAllComponents({
			name: 'WtTextarea',
		}),
	].find((component) => component.props('label') === label);
	if (!field) throw new Error(`no field labelled ${label}`);
	return field;
};

const typeInto = async (wrapper: Wrapper, label: string, value: unknown) => {
	fieldLabeled(wrapper, label).vm.$emit('update:modelValue', value);
	await flushPromises();
};

const buttonTitled = (wrapper: Wrapper, title: string) => {
	const button = wrapper
		.findAllComponents({
			name: 'WtButton',
		})
		.find((component) => component.text() === title);
	if (!button) throw new Error(`no button titled ${title}`);
	return button;
};

const saveButton = (wrapper: Wrapper) => buttonTitled(wrapper, 'reusable.save');

const cancelButton = (wrapper: Wrapper) =>
	buttonTitled(wrapper, 'reusable.cancel');

describe('contact-create-form', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				stubActions: false,
			}),
		);
		const userinfoStore = useUserinfoStore();
		userinfoStore.userId = '10';
		userinfoStore.userInfo = {
			name: 'Agent Smith',
		};
	});

	it('shows every field of the mini window', () => {
		const wrapper = mountForm();

		for (const label of [
			'reusable.name',
			'ui.reusable.phoneNumber',
			'vocabulary.emails',
			'date.timezone',
			'objects.owner',
			'vocabulary.labels',
			'vocabulary.description',
		]) {
			expect(fieldLabeled(wrapper, label).exists()).toBe(true);
		}
	});

	it('fills the owner with the agent who opened it', () => {
		const wrapper = mountForm();

		expect(fieldLabeled(wrapper, 'objects.owner').props('modelValue')).toEqual({
			id: '10',
			name: 'Agent Smith',
		});
	});

	it('lets labels take a value typed by the agent', () => {
		const wrapper = mountForm();

		expect(
			fieldLabeled(wrapper, 'vocabulary.labels').props('allowCustomValues'),
		).toBe(true);
	});

	it('keeps SAVE disabled until the name is filled', async () => {
		const wrapper = mountForm();
		expect(saveButton(wrapper).props('disabled')).toBe(true);

		await typeInto(wrapper, 'reusable.name', '   ');
		expect(saveButton(wrapper).props('disabled')).toBe(true);

		await typeInto(wrapper, 'reusable.name', 'Jane Doe');
		expect(saveButton(wrapper).props('disabled')).toBe(false);
	});

	it('keeps SAVE disabled for a malformed email, and enabled for none', async () => {
		const wrapper = mountForm();
		await typeInto(wrapper, 'reusable.name', 'Jane Doe');

		await typeInto(wrapper, 'vocabulary.emails', 'not-an-email');
		expect(saveButton(wrapper).props('disabled')).toBe(true);

		await typeInto(wrapper, 'vocabulary.emails', '');
		expect(saveButton(wrapper).props('disabled')).toBe(false);
	});

	it('checks the email as it is sent, without surrounding spaces', async () => {
		const wrapper = mountForm();
		await typeInto(wrapper, 'reusable.name', 'Jane Doe');

		await typeInto(wrapper, 'vocabulary.emails', ' jane@example.com ');
		expect(saveButton(wrapper).props('disabled')).toBe(false);

		await typeInto(wrapper, 'vocabulary.emails', '   ');
		expect(saveButton(wrapper).props('disabled')).toBe(false);
	});

	it('keeps SAVE and CANCEL disabled while a save is in flight', async () => {
		const wrapper = mountForm(true);
		await typeInto(wrapper, 'reusable.name', 'Jane Doe');

		expect(saveButton(wrapper).props('disabled')).toBe(true);
		expect(saveButton(wrapper).props('loading')).toBe(true);
		expect(cancelButton(wrapper).props('disabled')).toBe(true);
	});

	it('lets CANCEL be pressed when nothing is being saved', () => {
		const wrapper = mountForm();

		expect(cancelButton(wrapper).props('disabled')).toBe(false);
	});

	it('hands over what was typed on SAVE', async () => {
		const wrapper = mountForm();
		await typeInto(wrapper, 'reusable.name', 'Jane Doe');
		await typeInto(wrapper, 'ui.reusable.phoneNumber', '+380501234567');
		await typeInto(wrapper, 'vocabulary.labels', [
			{
				label: 'vip',
			},
		]);

		await saveButton(wrapper).trigger('click');

		expect(wrapper.emitted('submit')).toEqual([
			[
				{
					name: 'Jane Doe',
					phoneNumber: '+380501234567',
					email: '',
					timezone: null,
					owner: {
						id: '10',
						name: 'Agent Smith',
					},
					labels: [
						{
							label: 'vip',
						},
					],
					description: '',
				},
			],
		]);
	});

	it('hands over nothing on SAVE without a name', async () => {
		const wrapper = mountForm();

		await saveButton(wrapper).trigger('click');

		expect(wrapper.emitted('submit')).toBeUndefined();
	});

	it('asks to close on CANCEL', async () => {
		const wrapper = mountForm();

		await cancelButton(wrapper).trigger('click');

		expect(wrapper.emitted('cancel')).toHaveLength(1);
	});
});
