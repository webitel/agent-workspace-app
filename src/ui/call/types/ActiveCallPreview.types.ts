export interface ActiveCallPreview {
	name?: string;
	/** Already masked when the platform hides the number. */
	number?: string;
	queueName?: string;
	/** Epoch ms the call was answered at, the start of the call timer. */
	answeredAt: number;
	isHold: boolean;
	isMuted: boolean;
}
