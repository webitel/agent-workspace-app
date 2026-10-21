import { createSystemSettingsStore } from '@webitel/ui-sdk/modules/SystemSettings';

// [Claude] list a setting here once a feature reads it: events for settings not listed are ignored
export const useSystemSettingsStore = createSystemSettingsStore({
	names: [],
});
