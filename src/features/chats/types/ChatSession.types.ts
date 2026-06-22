// Per-chat data shapes come straight from the SDK; re-exported here so feature
// code has one import surface and does not reach into the sdk for every type.
export type {
	IMessage,
	MessageHistorySearchParams,
	MessageHistorySearchResult,
} from '@webitel/chat-web-sdk';
export type { IThread, ThreadModel } from '@webitel/chat-web-sdk';

// UI-only window layout state — not part of the SDK domain.
export type ChatWindowMode = 'main' | 'minimized';

export interface OpenChat {
	id: string;
	mode: ChatWindowMode;
}
