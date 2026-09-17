import type { CallDirection, VideoMediaFlow } from 'webitel-sdk';

export interface CallQueue {
	id?: number;
	queue_type?: string;
	queue_name?: string;
	manual_distribution?: boolean;
}

export interface CallSip {
	remoteVideoMuted?: boolean;
	remoteHold?: boolean;
}

export interface Call {
	id: string;
	direction: CallDirection;
	state: string;
	active: boolean;
	muted: boolean;
	mutedVideo: boolean;
	isHold: boolean;
	allowHold: boolean;
	allowUnHold: boolean;
	allowAnswer: boolean | undefined;
	allowHangup: boolean;
	allowDtmf: boolean;
	isEavesdrop: boolean;
	firstActive: boolean;
	displayName: string;
	displayNumber: string;
	answeredAt?: number;
	digits?: string[];
	params?: { autoAnswer?: boolean };
	queue?: CallQueue;
	peerStreams: MediaStream[];
	remoteVideo?: VideoMediaFlow;
	remoteVideoMuted: boolean;
	remoteAudioMuted: boolean;
	sip?: CallSip;
	conversation?: unknown;
	workspaceAudio?: HTMLAudioElement;

	answer(params?: Record<string, unknown>): Promise<void>;
	blindTransfer(number: string): Promise<void>;
	bridgeTo(call: Call): Promise<void>;
	mute(value: boolean): Promise<void>;
	toggleHold(): Promise<void>;
	hold(): Promise<void>;
	sendDTMF(value: string): Promise<void>;
	hangup(): Promise<void>;
	muteVideo(value: boolean): void;
}

export interface NewCallState {
	_isNew: true;
	newNumber: string;
}

export type CallWorkspaceTask = Call | NewCallState;

export interface CallInfo {
	sip?: Pick<CallSip, 'remoteVideoMuted'>;
	remoteHold?: boolean;
	remoteVideoMuted?: boolean;
	remoteAudioMuted?: boolean;
}
