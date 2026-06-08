import { getDefaultInstance } from '@webitel/api-services/api/defaults';

export const instance = getDefaultInstance();

// compat for @aliasedDeps/api-services/axios. prefer named export
export default instance;
