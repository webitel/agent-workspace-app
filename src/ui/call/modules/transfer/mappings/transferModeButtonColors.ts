import { ButtonColor } from '@webitel/ui-sdk/enums';

import { TransferMode } from '../enums/TransferMode.enum';

/**
 * @author Oleksandr Palonnyi
 * the transfer popup colours its buttons by what they do: Blind hands the call
 * over in the transfer blue, Consult goes on to speak to the destination first
 * and takes the success green
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const TRANSFER_MODE_BUTTON_COLORS: Record<TransferMode, ButtonColor> = {
	[TransferMode.Blind]: ButtonColor.TRANSFER,
	[TransferMode.Consult]: ButtonColor.SUCCESS,
};
