import type { IconColor } from '@webitel/ui-sdk/enums';
import type { CallDirection } from 'webitel-sdk';

import type { CallPanelInfoField } from '../enums/CallPanelInfoField.enum';

/**
 * The call as the right panel's info block shows it (US_13.06). Absent values
 * are `undefined`, so the block hides the row instead of drawing an empty one.
 */
export interface CallPanelInfo {
	direction?: CallDirection;
	from?: string;
	to?: string;
	queueName?: string;
	createdAt?: number;
	answeredAt?: number;
}

/** What differs between call directions: icon, title, and which fields in which order. */
export interface CallPanelInfoView {
	icon: string;
	iconColor: IconColor;
	title: () => string;
	fields: CallPanelInfoField[];
}

export interface CallPanelInfoFieldDef {
	label: () => string;
	value: (info: CallPanelInfo) => string | undefined;
}

export interface CallPanelInfoRow {
	field: CallPanelInfoField;
	label: string;
	value: string;
}
