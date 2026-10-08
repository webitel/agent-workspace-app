export const CallInfoTab = {
	Variables: 'variables',
	Postprocessing: 'postprocessing',
	Transcription: 'transcription',
} as const;

export type CallInfoTab = (typeof CallInfoTab)[keyof typeof CallInfoTab];
