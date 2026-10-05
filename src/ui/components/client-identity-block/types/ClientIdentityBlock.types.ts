/** A secondary line rendered as `${label}: ${value}`, e.g. `Channel: Telegram`. */
export interface ClientIdentityChannel {
	label: string;
	value: string;
	/** Icon name; the line renders without one when absent. */
	icon?: string;
}
