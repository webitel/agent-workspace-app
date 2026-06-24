import { UserStatus } from '../enums/UserStatus';

const parseUserStatus = (status) => ({
	[UserStatus.Dnd]: status?.includes('dnd'),
	[UserStatus.Busy]: status?.includes('dlg'),
	[UserStatus.Sip]: status?.includes('sip'),
	[UserStatus.Web]: status?.includes('web'),
});

export default parseUserStatus;
