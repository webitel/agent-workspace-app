/**
 * Runtime app config shape for agent-workspace-app.
 *
 * Loaded from a static `config.{json,jsonc}` (+ optional `config.local.*`)
 * served next to the app and merged over {@link defaultConfig}.
 */
export type AppConfig = {
	/** On-premise installation — Grafana (Analytics) is available in the app navigator */
	ON_SITE: boolean;
};
