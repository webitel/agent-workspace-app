import { useSystemSettings } from '@webitel/ui-sdk/modules/SystemSettings';
import { defineStore } from 'pinia';

export const useSystemSettingsStore = defineStore('system-settings', () => {
	// [Claude] list a setting here once a feature reads it: events for settings not listed are ignored
	const { settings, initialize, reload, applyChange, subscribe } =
		useSystemSettings([]);

	return {
		settings,

		initialize,
		reload,
		applyChange,
		subscribe,
	};
});
