import { TransferMode } from '../enums/TransferMode.enum';
import { TransferTab } from '../enums/TransferTab.enum';

/**
 * @author Oleksandr Palonnyi
 * which transfer a row of each tab can be sent with: an agent can only be
 * consulted, a user or a dialplan only blind-transferred, a queue takes both
 * (AC_13.07.08–11)
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const TRANSFER_MODES_BY_TAB: Record<
	TransferTab,
	readonly TransferMode[]
> = {
	[TransferTab.Agents]: [
		TransferMode.Consult,
	],
	[TransferTab.Queues]: [
		TransferMode.Blind,
		TransferMode.Consult,
	],
	[TransferTab.Users]: [
		TransferMode.Blind,
	],
	[TransferTab.Dialplans]: [
		TransferMode.Blind,
	],
};
