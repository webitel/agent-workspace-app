import { AbstractUserStatus } from '@webitel/ui-sdk/enums';

export const UserStatusColorMappings = {
	[AbstractUserStatus.ACTIVE]: 'success',
	[AbstractUserStatus.ONLINE]: 'success',
	[AbstractUserStatus.DND]: 'break-out',
	[AbstractUserStatus.BUSY]: 'error',
	[AbstractUserStatus.PAUSE]: 'break-out',
	[AbstractUserStatus.OFFLINE]: 'disabled',
};
