import type { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';
import type { TransferMode } from '../enums/TransferMode.enum';
import type { TransferTab } from '../enums/TransferTab.enum';

export type TransferDestination =
	| {
			kind: 'number';
			number: string;
	  }
	| {
			kind: 'row';
			tab: TransferTab;
			rowId: string;
	  };

export interface TransferRequest {
	mode: TransferMode;
	destination: TransferDestination;
}

export interface TransferAgentRow {
	id: string;
	name: string;
	teamName?: string;
	status?: TransferAgentStatus;
}

/**
 * @author Oleksandr Palonnyi
 * the part of an agent the Agents tab reads, so the module does not depend on
 * the shape of the API model
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export interface TransferAgentSource {
	id: string;
	name?: string;
	status?: string;
	team?: {
		name?: string;
	};
	userPresenceStatus?: {
		status?: string;
	};
}

export type TransferModeAvailability = Record<TransferMode, boolean>;

export interface TransferActionAvailability {
	byNumber: TransferModeAvailability;
	bySelection: TransferModeAvailability;
}
