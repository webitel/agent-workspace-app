/**
 * @author Oleksandr Palonnyi
 * The agent picks the interface language and its fallback in the Settings app,
 * which keeps them under these keys in localStorage; every webitel app on the
 * origin reads them from there at startup, as `cc-workspaces` and ui-sdk's own
 * `reloadOnStaleChunk` and DebugRecorder do.
 * [WS-163](https://webitel.atlassian.net/browse/WS-163) [NWS][FE] Додати локалізації для NWS
 */
export const LocaleStorageKey = {
	Locale: 'lang',
	FallbackLocale: 'fallbackLang',
} as const;
export type LocaleStorageKey =
	(typeof LocaleStorageKey)[keyof typeof LocaleStorageKey];
