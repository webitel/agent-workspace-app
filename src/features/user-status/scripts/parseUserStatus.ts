import { UserStatus } from '../enums/UserStatus';

const parseUserStatus = (status) => ({
	[UserStatus.DND]: status?.includes('dnd'),
	[UserStatus.BUSY]: status?.includes('dlg'),
	[UserStatus.SIP]: status?.status?.includes('sip'),
	[UserStatus.WEB]: status?.status?.includes('web'),
});

export default parseUserStatus;
