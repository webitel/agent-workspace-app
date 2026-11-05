/** One "label: value" line of a communication's info block; no value hides the line. */
export interface CommunicationInfoField {
	/** Stable id of the line: keys the list and names its value slot. */
	key: string;
	label: string;
	value?: string;
}
