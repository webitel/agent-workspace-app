import { beforeEach, describe, expect, it, vi } from 'vitest';

const getListPost = vi.fn();

vi.mock('@webitel/api-services/api', () => ({
	CallHistoryAPI: {
		getListPost: (...args: unknown[]) => getListPost(...args),
	},
}));

import { getCallInfo } from '../callInfoApi';

const mockCall = (call: Record<string, unknown>) =>
	getListPost.mockResolvedValue({
		items: [
			{
				id: '1',
				...call,
			},
		],
	});

describe('getCallInfo', () => {
	beforeEach(() => {
		getListPost.mockReset();
		getListPost.mockResolvedValue({
			items: [],
		});
	});

	it('requests a single call by id for all time', async () => {
		await getCallInfo('1');

		expect(getListPost).toHaveBeenCalledWith({
			data: {
				id: [
					'1',
				],
				fields: [
					'id',
					'variables',
					'forms',
					'agent_description',
					'transcripts',
				],
				createdAt: {
					from: 0,
				},
				size: 1,
			},
			doNotConvertKeys: [
				'variables',
				'form_fields',
			],
		});
	});

	it('returns undefined when the call is not found', async () => {
		await expect(getCallInfo('1')).resolves.toBeUndefined();
	});

	it('keeps call fields as is', async () => {
		mockCall({
			variables: {
				lang: 'uk',
			},
			agentDescription: 'callback later',
		});

		await expect(getCallInfo('1')).resolves.toMatchObject({
			id: '1',
			variables: {
				lang: 'uk',
			},
			agentDescription: 'callback later',
			forms: [],
		});
	});

	it('turns form_fields into a fields list', async () => {
		const agent = {
			id: '7',
			name: 'Polina',
		};
		mockCall({
			forms: [
				{
					agent,
					form_fields: {
						status: 'done',
						note: 'ok',
					},
				},
			],
		});

		const callInfo = await getCallInfo('1');

		expect(callInfo?.forms).toEqual([
			{
				agent,
				fields: [
					{
						key: 'status',
						value: 'done',
					},
					{
						key: 'note',
						value: 'ok',
					},
				],
			},
		]);
	});

	it('drops forms without fields', async () => {
		mockCall({
			forms: [
				{
					form_fields: {},
				},
				{},
				{
					form_fields: {
						status: 'done',
					},
				},
			],
		});

		const callInfo = await getCallInfo('1');

		expect(callInfo?.forms).toHaveLength(1);
		expect(callInfo?.forms[0].fields).toEqual([
			{
				key: 'status',
				value: 'done',
			},
		]);
	});

	it('shows file fields as a list of file names', async () => {
		mockCall({
			forms: [
				{
					form_fields: {
						filesIncome: JSON.stringify([
							{
								name: 'a.pdf',
							},
							{
								name: 'b.png',
							},
						]),
						filesOutcome: JSON.stringify([]),
					},
				},
			],
		});

		const callInfo = await getCallInfo('1');

		expect(callInfo?.forms[0].fields).toEqual([
			{
				key: 'filesIncome',
				value: 'a.pdf, b.png',
			},
			{
				key: 'filesOutcome',
				value: '',
			},
		]);
	});

	it('keeps a file field value as is when it is not valid JSON', async () => {
		mockCall({
			forms: [
				{
					form_fields: {
						filesIncome: 'not json',
					},
				},
			],
		});

		const callInfo = await getCallInfo('1');

		expect(callInfo?.forms[0].fields).toEqual([
			{
				key: 'filesIncome',
				value: 'not json',
			},
		]);
	});

	it('does not parse JSON in regular fields', async () => {
		const value = JSON.stringify([
			{
				name: 'a.pdf',
			},
		]);
		mockCall({
			forms: [
				{
					form_fields: {
						note: value,
					},
				},
			],
		});

		const callInfo = await getCallInfo('1');

		expect(callInfo?.forms[0].fields[0].value).toBe(value);
	});
});
