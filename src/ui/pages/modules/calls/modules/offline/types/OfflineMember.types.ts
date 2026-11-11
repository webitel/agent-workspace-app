/**
 * The SDK types an offline member as `{ id: number; [key: string]: any }`,
 * so the shape is described here, from the `cc_fetch_offline_members` reply
 * after snake_case → camelCase. Only the fields the tab reads.
 */
export interface OfflineMemberCommunication {
	id: number;
	destination: string;
	channel: string;
	type: {
		id: number;
		name: string;
	};
}

export interface OfflineMember {
	id: number;
	name: string;
	queue: {
		id: number;
		name: string;
	};
	communications: OfflineMemberCommunication[];
}
