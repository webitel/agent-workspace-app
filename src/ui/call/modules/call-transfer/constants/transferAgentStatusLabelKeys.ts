import { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';

/**
 * @author Oleksandr Palonnyi
 * the first four keys are @webitel/ui-sdk's `objects.agent.status.*`, where break_out is stored camelCased.
 * The library has no key for DnD, which is a presence and not an agent status, so it reuses the header's DnD label
 * [WS-125](https://webitel.atlassian.net/browse/WS-125)
 */
export const TRANSFER_AGENT_STATUS_LABEL_KEYS: Record<
	TransferAgentStatus,
	string
> = {
	[TransferAgentStatus.Online]: 'objects.agent.status.online',
	[TransferAgentStatus.Pause]: 'objects.agent.status.pause',
	[TransferAgentStatus.BreakOut]: 'objects.agent.status.breakOut',
	[TransferAgentStatus.Offline]: 'objects.agent.status.offline',
	[TransferAgentStatus.Dnd]: 'ui.header.dnd.label',
};
