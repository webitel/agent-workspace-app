/**
 * Variables are arbitrary JSON, but a cell is text: strings pass through whole
 * (never truncated, the agent needs the full value), absent values are blank,
 * structures become compact JSON.
 */
export function formatVariableValue(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}
