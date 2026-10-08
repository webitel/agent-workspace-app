import type { VariableRow } from '../types/Variables.types';
import { formatVariableValue } from './formatVariableValue';

/**
 * Turns one source's key/value map into table rows, in the map's own order.
 * `source` qualifies the row ids so rows from several sources can share a table.
 */
export function toVariableRows(
	variables: Record<string, unknown> | undefined,
	source: string,
): VariableRow[] {
	return Object.entries(variables ?? {}).map(([key, value]) => ({
		id: `${source}:${key}`,
		key,
		value: formatVariableValue(value),
	}));
}
