import type { TransferMode } from '../enums/TransferMode.enum';
import type { TransferTab } from '../enums/TransferTab.enum';

export type TransferDestination =
	| {
			kind: 'phone';
			phone: string;
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

export type TransferModeAvailability = Record<TransferMode, boolean>;

export interface TransferActionAvailability {
	byPhone: TransferModeAvailability;
	bySelection: TransferModeAvailability;
}
