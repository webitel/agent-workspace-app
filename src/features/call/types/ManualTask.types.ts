export interface ManualTask {
	attemptId: string; // WHY STRING IF interceptAttempt TAKES NUMBER
	channel: string;
	communication: { destination: string };
	position: number;
	deadline: number;
	queue: { id: number; name: string };
	wait: number;
}
