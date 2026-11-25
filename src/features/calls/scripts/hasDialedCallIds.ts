import type { DialedCallIds } from '../types/DialedCallIds.types';

export function hasDialedCallIds(dialedCallIds: DialedCallIds): boolean {
	return Boolean(dialedCallIds.callId || dialedCallIds.sipId);
}
