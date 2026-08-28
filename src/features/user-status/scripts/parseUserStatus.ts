import { UserStatus } from '../enums/UserStatus';

export const parseUserStatus = (status) => ({
	[UserStatus.Dnd]: status?.includes('dnd'),
	[UserStatus.Busy]: status?.includes('dlg'),
	[UserStatus.Sip]: status?.includes('sip'),
	[UserStatus.Web]: status?.includes('web'),
});
