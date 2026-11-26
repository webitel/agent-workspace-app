import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, toRaw } from 'vue';
import { type Call, CallActions, CallDirection } from 'webitel-sdk';

vi.mock('@webitel/ui-sdk/components', () => ({
	WtButton: {
		name: 'WtButton',
		emits: [
			'click',
		],
		template: '<button @click="$emit(\'click\')"><slot /></button>',
	},
}));

vi.mock(
	'../../../../../features/calls/modules/info/components/call-info-panel/call-info-panel.vue',
	() => ({
		default: {
			name: 'CallInfoPanel',
			props: [
				'content',
			],
			template: '<div class="call-info-panel-stub" />',
		},
	}),
);

const identification = {
	contactIds: ref<string[]>([]),
	isLoading: ref(false),
	isContactHidden: ref(false),
	selectContact: vi.fn(),
};
let identifiedCall: (() => Call) | undefined;

// the identification itself is covered by the composable's own tests
vi.mock(
	'../../../../../features/calls/modules/contact/composables/useCallContact',
	() => ({
		useCallContact: (call: () => Call) => {
			identifiedCall = call;
			return identification;
		},
	}),
);

vi.mock('../../../components/contact/contact-identification.vue', () => ({
	default: {
		name: 'ContactIdentification',
		props: [
			'contactIds',
			'isLoading',
			'canSelect',
		],
		emits: [
			'select',
		],
		template:
			'<div class="contact-identification-stub"><slot name="actions" /></div>',
	},
}));

vi.mock('../../../components/contact/contact-create-form.vue', () => ({
	default: {
		name: 'ContactCreateForm',
		props: [
			'isSaving',
		],
		emits: [
			'submit',
			'cancel',
		],
		template: '<div class="contact-create-form-stub" />',
	},
}));

const creation = {
	isSaving: ref(false),
	createContact: vi.fn<() => Promise<string | null>>(),
};
vi.mock('../../../components/contact/composables/useContactCreation', () => ({
	useContactCreation: () => creation,
}));

import TheCallPanel from '../the-call-panel.vue';

const draft = {
	name: 'Jane Doe',
	phoneNumber: '',
	email: '',
	timezone: null,
	owner: null,
	labels: [],
	description: '',
};

const createDeferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return {
		promise,
		resolve,
	};
};

const buildCall = (overrides: Record<string, unknown> = {}) =>
	({
		id: 'call-1',
		direction: CallDirection.Inbound,
		from: {
			type: 'dest',
			number: '+12023417842',
		},
		to: {
			type: 'user',
			number: '1001',
		},
		hideNumber: false,
		queue: {
			queue_name: 'Sales',
		},
		createdAt: 1_700_000_000_000,
		answeredAt: 1_700_000_015_000,
		state: CallActions.Active,
		...overrides,
	}) as unknown as Call;

const call = buildCall();

const mountPanel = (panelCall: Call = call) =>
	mount(TheCallPanel, {
		props: {
			call: panelCall,
		},
	});

const findIdentification = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent({
		name: 'ContactIdentification',
	});

const findCreateForm = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent({
		name: 'ContactCreateForm',
	});

const findCreateButton = (wrapper: ReturnType<typeof mountPanel>) =>
	wrapper.findComponent({
		name: 'WtButton',
	});

describe('the-call-panel', () => {
	beforeEach(() => {
		identification.contactIds.value = [];
		identification.isLoading.value = false;
		identification.isContactHidden.value = false;
		identifiedCall = undefined;
		identification.selectContact.mockClear();
		creation.isSaving.value = false;
		creation.createContact.mockReset();
	});

	it('shows the info of the given call', () => {
		const wrapper = mountPanel();

		expect(
			wrapper
				.findComponent({
					name: 'CallInfoPanel',
				})
				.props('content'),
		).toMatchObject({
			direction: CallDirection.Inbound,
			from: '+12023417842',
			queueName: 'Sales',
		});
	});

	it('identifies the contact of the given call', () => {
		mountPanel();

		expect(toRaw(identifiedCall?.())).toBe(call);
	});

	it('passes the identification result to the block', async () => {
		const wrapper = mountPanel();

		identification.contactIds.value = [
			'15',
			'16',
		];
		identification.isLoading.value = true;
		await nextTick();

		const block = findIdentification(wrapper);
		expect(block.props('contactIds')).toEqual([
			'15',
			'16',
		]);
		expect(block.props('isLoading')).toBe(true);
	});

	it('shows neither the block nor CREATE when the contact is hidden', () => {
		identification.isContactHidden.value = true;
		const wrapper = mountPanel();

		expect(findIdentification(wrapper).exists()).toBe(false);
		expect(findCreateButton(wrapper).exists()).toBe(false);
	});

	it.each([
		CallActions.Active,
		CallActions.Hold,
	])('offers CREATE while the call is %s', (state) => {
		const wrapper = mountPanel(
			buildCall({
				state,
			}),
		);

		expect(findCreateButton(wrapper).text()).toBe('reusable.create');
	});

	it.each([
		CallActions.Ringing,
		CallActions.Hangup,
	])('does not offer CREATE when the call is %s', (state) => {
		const wrapper = mountPanel(
			buildCall({
				state,
			}),
		);

		expect(findCreateButton(wrapper).exists()).toBe(false);
	});

	it('replaces the contact block with the create form, keeping the call info', async () => {
		const wrapper = mountPanel();

		await findCreateButton(wrapper).trigger('click');

		expect(findCreateForm(wrapper).exists()).toBe(true);
		expect(findIdentification(wrapper).exists()).toBe(false);
		expect(findCreateButton(wrapper).exists()).toBe(false);
		expect(wrapper.find('.call-info-panel-stub').exists()).toBe(true);
	});

	it('returns to the contact block when the form is cancelled', async () => {
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		findCreateForm(wrapper).vm.$emit('cancel');
		await nextTick();

		expect(findCreateForm(wrapper).exists()).toBe(false);
		expect(findIdentification(wrapper).exists()).toBe(true);
	});

	it('closes the create form when another call is opened', async () => {
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		await wrapper.setProps({
			call: buildCall({
				id: 'call-2',
			}),
		});

		expect(findCreateForm(wrapper).exists()).toBe(false);
		expect(findIdentification(wrapper).exists()).toBe(true);
	});

	it.each([
		CallActions.Active,
		CallActions.Hold,
	])('lets the agent select a contact while the call is %s', (state) => {
		const wrapper = mountPanel(
			buildCall({
				state,
			}),
		);

		expect(findIdentification(wrapper).props('canSelect')).toBe(true);
	});

	it.each([
		CallActions.Ringing,
		CallActions.Hangup,
	])('does not let the agent select a contact when the call is %s', (state) => {
		const wrapper = mountPanel(
			buildCall({
				state,
			}),
		);

		expect(findIdentification(wrapper).props('canSelect')).toBe(false);
	});

	it('links the contact selected in the block', () => {
		const wrapper = mountPanel();

		findIdentification(wrapper).vm.$emit('select', '16');

		expect(identification.selectContact).toHaveBeenCalledWith('16');
	});

	it('heads the create form with Add contacts', async () => {
		const wrapper = mountPanel();

		await findCreateButton(wrapper).trigger('click');

		expect(wrapper.text()).toContain('ui.sidebar.contact.addContacts');
	});

	it('links the created contact to the call and closes the form', async () => {
		creation.createContact.mockResolvedValue('42');
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		findCreateForm(wrapper).vm.$emit('submit', draft);
		await flushPromises();

		expect(creation.createContact).toHaveBeenCalledWith(draft);
		expect(identification.selectContact).toHaveBeenCalledWith('42');
		expect(findCreateForm(wrapper).exists()).toBe(false);
	});

	it('keeps the form saving until the created contact is linked', async () => {
		const link = createDeferred<void>();
		identification.selectContact.mockReturnValueOnce(link.promise);
		creation.createContact.mockResolvedValue('42');
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		findCreateForm(wrapper).vm.$emit('submit', draft);
		await flushPromises();

		expect(findCreateForm(wrapper).props('isSaving')).toBe(true);

		link.resolve();
		await flushPromises();

		expect(findCreateForm(wrapper).exists()).toBe(false);
	});

	it('keeps the create form open when the contact was not created', async () => {
		creation.createContact.mockResolvedValue(null);
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		findCreateForm(wrapper).vm.$emit('submit', draft);
		await flushPromises();

		expect(findCreateForm(wrapper).exists()).toBe(true);
		expect(identification.selectContact).not.toHaveBeenCalled();
	});

	it('does not link the created contact to a call opened meanwhile', async () => {
		const request = createDeferred<string | null>();
		creation.createContact.mockReturnValue(request.promise);
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		findCreateForm(wrapper).vm.$emit('submit', draft);
		await wrapper.setProps({
			call: buildCall({
				id: 'call-2',
			}),
		});
		request.resolve('42');
		await flushPromises();

		expect(identification.selectContact).not.toHaveBeenCalled();
	});

	it('does not link the created contact to a call hung up meanwhile', async () => {
		const request = createDeferred<string | null>();
		creation.createContact.mockReturnValue(request.promise);
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		findCreateForm(wrapper).vm.$emit('submit', draft);
		await wrapper.setProps({
			call: buildCall({
				state: CallActions.Hangup,
			}),
		});
		request.resolve('42');
		await flushPromises();

		expect(identification.selectContact).not.toHaveBeenCalled();
	});

	it('closes the create form when the call hangs up', async () => {
		const wrapper = mountPanel();
		await findCreateButton(wrapper).trigger('click');

		await wrapper.setProps({
			call: buildCall({
				state: CallActions.Hangup,
			}),
		});

		expect(findCreateForm(wrapper).exists()).toBe(false);
	});
});
