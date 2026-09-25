/**
 * Turns a column path into steps: `contact.emails[11].name` ->
 * ['contact', 'emails', '11', 'name'] (WTEL-6890).
 */
export function toPathSteps(path: string): string[] {
	return path.replaceAll(/[[\]]/g, '.').split('.').filter(Boolean);
}

/**
 * A column path as a `wt-table` slot name: `contact.emails[11].name` ->
 * `contact_emails_11__name`. cc-workspaces replaced only the first `.`, `[`
 * and `]`, which left dots in deeper paths.
 */
export function toSlotKey(path: string): string {
	return path.replaceAll(/[.[\]]/g, '_');
}

type Nested = Record<string, unknown> | unknown[];

function readSteps(value: unknown, steps: string[]): unknown {
	return steps.reduce<unknown>(
		(current, step) =>
			current !== null && typeof current === 'object'
				? (current as Record<string, unknown>)[step]
				: undefined,
		value,
	);
}

/**
 * Reads the value a column shows. A direct path wins; failing that, arrays
 * along the way fan out, so `permissions.name` over
 * `[{ name: 'A' }, { name: 'B' }]` yields `['A', 'B']`. 0 is a value.
 */
export function readColumnValue(value: unknown, steps: string[]): unknown {
	if (value === 0) return 0;
	if (!value) return undefined;
	if (!steps.length) return value;

	const direct = readSteps(value, steps);
	if (direct) return direct;

	if (Array.isArray(value)) {
		return value.map((item) => readColumnValue(item, steps)).filter(Boolean);
	}
	if (typeof value === 'object') {
		const [first, ...rest] = steps;
		return readColumnValue(
			(value as Nested & Record<string, unknown>)[first],
			rest,
		);
	}
	return value;
}
