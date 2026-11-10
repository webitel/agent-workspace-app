import { TransferAgentStatus } from '../enums/TransferAgentStatus.enum';

export const TRANSFER_AGENT_BADGE_COLOR_VARIABLES: Record<
	TransferAgentStatus,
	string
> = {
	[TransferAgentStatus.Online]: 'success-color',
	[TransferAgentStatus.Pause]: 'hold-color',
	[TransferAgentStatus.BreakOut]: 'info-color',
	[TransferAgentStatus.Offline]: 'disabled-color',
	[TransferAgentStatus.Dnd]: 'error-color',
};
