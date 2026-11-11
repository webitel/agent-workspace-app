import { describe, expect, it } from 'vitest';

import { toTransferQueueRow } from '../toTransferQueueRow';

describe('toTransferQueueRow', () => {
	it('maps the name and the description of a queue', () => {
		expect(
			toTransferQueueRow({
				id: '3',
				name: 'Support',
				description: 'First line',
			}),
		).toEqual({
			id: '3',
			name: 'Support',
			description: 'First line',
		});
	});

	it('keeps a row for a queue without a name or a description', () => {
		expect(
			toTransferQueueRow({
				id: '3',
			}),
		).toEqual({
			id: '3',
			name: '',
			description: '',
		});
	});
});
