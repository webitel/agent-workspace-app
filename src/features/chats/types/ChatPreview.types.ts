import type { ThreadModel } from '@webitel/chat-web-sdk';
import type { Client } from 'webitel-sdk';

type AgentTask = NonNullable<ReturnType<Client['getTask']>>;

export type TaskPreview = AgentTask & {
	distribute: {
		communication: {
			thread: ChatPreview;
		};
		member_channel_id: string;
	};
};

export interface ChatPreview
	extends Pick<ThreadModel, 'lastMsg' | 'members' | 'subject'> {}
