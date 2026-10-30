import { sanitizeDestination } from '../../../../../features/calls/scripts/sanitizeDestination';
import { TRANSFER_MODES_BY_TAB } from '../constants/transferModesByTab';
import { TransferMode } from '../enums/TransferMode.enum';
import type { TransferTab } from '../enums/TransferTab.enum';
import type { TransferActionAvailability } from '../types/CallTransfer.types';

/**
 * @author Oleksandr Palonnyi
 * the popup has two pairs of BLIND / CONSULT buttons and only one pair is
 * live at a time: the top pair sends to the typed number, the bottom pair to
 * the selected row, and a selected row wins over the number (AC_13.07.12)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export function getTransferActionAvailability({
	phone,
	tab,
	hasSelection,
}: {
	phone: string;
	tab: TransferTab;
	hasSelection: boolean;
}): TransferActionAvailability {
	const isPhoneSendable =
		sanitizeDestination(phone).length > 0 && !hasSelection;
	const modesOfTab = TRANSFER_MODES_BY_TAB[tab];

	return {
		byPhone: {
			[TransferMode.Blind]: isPhoneSendable,
			[TransferMode.Consult]: isPhoneSendable,
		},
		bySelection: {
			[TransferMode.Blind]:
				hasSelection && modesOfTab.includes(TransferMode.Blind),
			[TransferMode.Consult]:
				hasSelection && modesOfTab.includes(TransferMode.Consult),
		},
	};
}
