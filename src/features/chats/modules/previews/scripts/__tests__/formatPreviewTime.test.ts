import { describe, expect, it } from 'vitest';

import { formatPreviewTime } from '../formatPreviewTime';

// 2026-06-14 (Sunday) 15:43 local
const now = new Date(2026, 5, 14, 15, 43);
const at = (year: number, month: number, day: number, hour = 9, minute = 5) =>
	new Date(year, month - 1, day, hour, minute).getTime();

describe('formatPreviewTime', () => {
	it('shows only the time for today, zero-padded', () => {
		expect(
			formatPreviewTime(at(2026, 6, 14), {
				now,
			}),
		).toBe('09:05');
	});

	it('treats a future timestamp as today', () => {
		expect(
			formatPreviewTime(at(2026, 6, 15, 8, 0), {
				now,
			}),
		).toBe('08:00');
	});

	it('counts calendar days: late yesterday is still yesterday just after midnight', () => {
		const justAfterMidnight = new Date(2026, 5, 14, 0, 10);

		expect(
			formatPreviewTime(at(2026, 6, 13, 23, 50), {
				now: justAfterMidnight,
				locale: 'en',
			}),
		).toBe('Sat');
	});

	it.each([
		[
			13,
			'Sat',
		],
		[
			12,
			'Fri',
		],
		[
			7,
			'Sun',
		],
	])('shows the weekday for %s of June, within the last week', (day, weekday) => {
		expect(
			formatPreviewTime(at(2026, 6, day), {
				now,
				locale: 'en',
			}),
		).toBe(weekday);
	});

	it('names the weekday in the given locale', () => {
		expect(
			formatPreviewTime(at(2026, 6, 13), {
				now,
				locale: 'uk',
			}),
		).toBe('сб');
	});

	it('switches to a date on the eighth day', () => {
		expect(
			formatPreviewTime(at(2026, 6, 6), {
				now,
			}),
		).toBe('06.06.2026');
	});

	it('zero-pads day and month of an older date', () => {
		expect(
			formatPreviewTime(at(2025, 1, 3), {
				now,
			}),
		).toBe('03.01.2025');
	});
});
