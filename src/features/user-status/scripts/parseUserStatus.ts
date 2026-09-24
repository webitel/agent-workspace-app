import { UserStatus } from '../enums/UserStatus';

export const parseUserStatus = (
	status: string,
): Record<UserStatus, boolean> => ({
	[UserStatus.Dnd]: status?.includes('dnd') ?? false,
	[UserStatus.Busy]: status?.includes('dlg') ?? false,
	[UserStatus.Sip]: status?.includes('sip') ?? false,
	[UserStatus.Web]: status?.includes('web') ?? false,
});
