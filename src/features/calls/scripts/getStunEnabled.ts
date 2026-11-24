export function getStunEnabled(): boolean {
	try {
		const config = JSON.parse(localStorage.getItem('CONFIG') ?? '{}') as {
			CLI?: {
				stun?: boolean;
			};
		};
		return config.CLI?.stun ?? true;
	} catch {
		return true;
	}
}
