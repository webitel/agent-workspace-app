import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, toRaw } from 'vue';
import { type Call, CallDirection } from 'webitel-sdk';

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
};
let identifiedCall: (() => Call) | undefined;

// the identification itself is covered by the composable's own tests
vi.mock(
	'../../../../../features/calls/modules/contactn/composables/useCallContactIdentification',
	() => ({
		useCallContactIdentification: (call: () => Call) => {
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
		],
		template: '<div class="contact-identification-stub" />',
	},
}));

vi.mock('../../../components/contact/contact-create-form.vue', () => ({
	default: {
		name: 'ContactCreateForm',
		emits: [
			'cancel',
		],
		template: '<div class="contact-create-form-stub" />',
	},
}));

import TheCallPanel from '../the-call-panel.vue';

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

	it('offers CREATE for an answered call', () => {
		const wrapper = mountPanel();

		expect(findCreateButton(wrapper).text()).toBe('reusable.create');
	});

	it('does not offer CREATE while the call is ringing', () => {
		const wrapper = mountPanel(
			buildCall({
				answeredAt: 0,
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
});
