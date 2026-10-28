import { describe, expect, it } from 'vitest';

import { TransferTab } from '../../enums/TransferTab.enum';
import { getTransferActionAvailability } from '../getTransferActionAvailability';

const NONE = {
	blind: false,
	consult: false,
};
const BOTH = {
	blind: true,
	consult: true,
};

describe('getTransferActionAvailability', () => {
	it('disables every button by default', () => {
		const availability = getTransferActionAvailability({
			number: '',
			tab: TransferTab.Agents,
			hasSelection: false,
		});

		expect(availability.byNumber).toEqual(NONE);
		expect(availability.bySelection).toEqual(NONE);
	});

	it('enables the number buttons for a typed number, on any tab', () => {
		for (const tab of Object.values(TransferTab)) {
			const availability = getTransferActionAvailability({
				number: '1001',
				tab,
				hasSelection: false,
			});

			expect(availability.byNumber).toEqual(BOTH);
			expect(availability.bySelection).toEqual(NONE);
		}
	});

	it('treats a blank number as no number', () => {
		const availability = getTransferActionAvailability({
			number: '   ',
			tab: TransferTab.Agents,
			hasSelection: false,
		});

		expect(availability.byNumber).toEqual(NONE);
	});

	it('treats a number of only non-dialable characters as no number', () => {
		const availability = getTransferActionAvailability({
			number: ' ( - ) ',
			tab: TransferTab.Agents,
			hasSelection: false,
		});

		expect(availability.byNumber).toEqual(NONE);
	});

	it('hands the buttons over to the selected row even when a number is typed', () => {
		const availability = getTransferActionAvailability({
			number: '1001',
			tab: TransferTab.Queues,
			hasSelection: true,
		});

		expect(availability.byNumber).toEqual(NONE);
		expect(availability.bySelection).toEqual(BOTH);
	});

	it.each([
		[
			TransferTab.Agents,
			{
				blind: false,
				consult: true,
			},
		],
		[
			TransferTab.Queues,
			BOTH,
		],
		[
			TransferTab.Users,
			{
				blind: true,
				consult: false,
			},
		],
		[
			TransferTab.Dialplans,
			{
				blind: true,
				consult: false,
			},
		],
	])('allows a selected %s row only the modes of that tab', (tab, expected) => {
		const availability = getTransferActionAvailability({
			number: '',
			tab,
			hasSelection: true,
		});

		expect(availability.bySelection).toEqual(expected);
	});
});
