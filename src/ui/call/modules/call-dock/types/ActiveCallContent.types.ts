export interface ActiveCallContent {
	name?: string;
	/** Already masked when the platform hides the number. */
	number?: string;
	queueName?: string;
	/** Epoch ms the call was answered at, the start of the call timer. */
	answeredAt: number;
	isHold: boolean;
	isMuted: boolean;
	/** The DTMF digits the server has confirmed for this call, in order. */
	dtmfDigits: string;
	/** The queue allows post-processing, so the call has a full view to open. */
	isPostProcessingEnabled: boolean;
}
