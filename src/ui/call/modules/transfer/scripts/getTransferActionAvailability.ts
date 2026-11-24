import { sanitizeDestination } from '../../../../../features/calls/scripts/sanitizeDestination';
import { TransferMode } from '../enums/TransferMode.enum';
import type { TransferTab } from '../enums/TransferTab.enum';
import { TRANSFER_MODES_BY_TAB } from '../mappings/transferModesByTab';
import type { TransferActionAvailability } from '../types/CallTransfer.types';

/**
 * @author Oleksandr Palonnyi
 * the popup has two pairs of BLIND / CONSULT buttons and only one pair is
 * live at a time: the top pair sends to the typed number, the bottom pair to
 * the selected row, and a selected row wins over the number (AC_13.07.12).
 * A selected row with nothing to send to (a user without an extension) still
 * holds the buttons, only disabled: the call stays with the agent, as BA
 * answered for AC_13.07.10 (ADR-0028)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function getTransferActionAvailability({
	phone,
	tab,
	hasSelection,
	hasSelectionDestination,
}: {
	phone: string;
	tab: TransferTab;
	hasSelection: boolean;
	hasSelectionDestination: boolean;
}): TransferActionAvailability {
	const isPhoneSendable =
		sanitizeDestination(phone).length > 0 && !hasSelection;
	const isSelectionSendable = hasSelection && hasSelectionDestination;
	const modesOfTab = TRANSFER_MODES_BY_TAB[tab];

	return {
		byPhone: {
			[TransferMode.Blind]: isPhoneSendable,
			[TransferMode.Consult]: isPhoneSendable,
		},
		bySelection: {
			[TransferMode.Blind]:
				isSelectionSendable && modesOfTab.includes(TransferMode.Blind),
			[TransferMode.Consult]:
				isSelectionSendable && modesOfTab.includes(TransferMode.Consult),
		},
	};
}
