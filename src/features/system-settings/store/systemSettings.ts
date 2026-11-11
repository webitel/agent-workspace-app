import { EngineSystemSettingName } from '@webitel/api-services/gen/models';
import { useSystemSettings } from '@webitel/ui-sdk/modules/SystemSettings';
import { defineStore } from 'pinia';

export const useSystemSettingsStore = defineStore('system-settings', () => {
	// [Claude] list a setting here once a feature reads it: events for settings not listed are ignored
	const { settings, initialize, reload, applyChange, subscribe } =
		useSystemSettings([
			EngineSystemSettingName.WbtHideContact,
		]);

	return {
		settings,

		initialize,
		reload,
		applyChange,
		subscribe,
	};
});
