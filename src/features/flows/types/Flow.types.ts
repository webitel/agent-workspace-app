import type { EngineTeamTrigger } from '@webitel/api-services/gen-wire/models';

export type Flow = Required<Pick<EngineTeamTrigger, 'id' | 'name'>>;
