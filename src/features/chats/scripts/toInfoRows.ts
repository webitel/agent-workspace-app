import { toVariableRows } from '../../variables/scripts/toVariableRows';
import type { VariableRow } from '../../variables/types/Variables.types';
import type { ThreadVariablesModel } from '../types/ChatSession.types';

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
}): VariableRow[] {
	const threadValues = Object.fromEntries(
		Object.entries(threadVariables ?? {}).map(([key, entry]) => [
			key,
			unwrapEnvelope(entry.value),
		]),
	);

	return [
		...toVariableRows(taskVariables, 'task'),
		...toVariableRows(threadValues, 'thread'),
	];
}
