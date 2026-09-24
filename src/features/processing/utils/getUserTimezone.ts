// localStorage key the UI-SDK Userinfo module stores the user timezone under.
// Mirrors @webitel/ui-sdk .../Userinfo/constants/UserSettingsConstants
// (TIMEZONE_STORAGE_KEY); inlined because the SDK subpath does not resolve types
// under this project's bundler module resolution.
const TIMEZONE_STORAGE_KEY = 'user-timezone-setting';

export function getUserTimezone(): string {
	const storedTimezone = localStorage.getItem(TIMEZONE_STORAGE_KEY);
	if (storedTimezone) return storedTimezone;

	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
