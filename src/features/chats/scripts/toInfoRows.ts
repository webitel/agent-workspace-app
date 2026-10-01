import type { ThreadVariablesModel } from '../types/ChatSession.types';

export interface InfoRow {
	/** source-qualified: the same key may legitimately come from both sources */
	id: string;
	key: string;
	value: string;
}

/**
 * Variables are arbitrary JSON, but a cell is text: strings pass through whole
 * (never truncated, the agent needs the full value), absent values are blank,
 * structures become compact JSON.
 */
function formatValue(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

/**
 * The thread wraps what was stored in a `{ "value": … }` envelope of its own, so
 * a variable set to `hello` reads back as `{ "value": "hello" }`. Peel exactly
 * that: an object whose only key is `value`. Anything with more in it is the
 * variable's own structure and stays whole.
 */
function unwrapEnvelope(value: unknown): unknown {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return value;
	}
	const keys = Object.keys(value);
	return keys.length === 1 && keys[0] === 'value'
		? (
				value as {
					value: unknown;
				}
			).value
		: value;
}

/**
 * Builds the Info tab's Key/Value rows from the two places a chat keeps
 * variables: the call-center task and the chat thread. Task rows come first.
 * A key present in both sources yields two rows, deliberately — neither source
 * is more authoritative, and the agent should see both.
 */
export function toInfoRows({
	taskVariables,
	threadVariables,
}: {
	taskVariables?: Record<string, unknown>;
	threadVariables?: ThreadVariablesModel['variables'];
}): InfoRow[] {
	const taskRows = Object.entries(taskVariables ?? {}).map(([key, value]) => ({
		id: `task:${key}`,
		key,
		value: formatValue(value),
	}));
	const threadRows = Object.entries(threadVariables ?? {}).map(
		([key, entry]) => ({
			id: `thread:${key}`,
			key,
			value: formatValue(unwrapEnvelope(entry.value)),
		}),
	);

	return [
		...taskRows,
		...threadRows,
	];
}
