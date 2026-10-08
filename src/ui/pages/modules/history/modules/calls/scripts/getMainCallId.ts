import type { EngineHistoryCall } from '@webitel/api-services/gen/models';

export const getMainCallId = ({
	parentId,
	id,
}: Pick<EngineHistoryCall, 'parentId' | 'id'>) => parentId || id;
