// SDK domain types re-exported for a single feature-level import surface.
export type {
	IMessage,
	MessageHistorySearchParams,
	MessageHistorySearchResult,
} from '@webitel/chat-web-sdk';
export type { IThread, ThreadModel } from '@webitel/chat-web-sdk';

// UI-only window layout state (not an SDK concept).
export type ChatWindowMode = 'main' | 'minimized';

export interface OpenChat {
	id: string;
	mode: ChatWindowMode;
}
