/**
 * Runtime app config shape for agent-workspace-app.
 *
 * Empty for now — add fields here as runtime-configurable settings appear.
 * Loaded from a static `config.{json,jsonc}` (+ optional `config.local.*`)
 * served next to the app and merged over {@link defaultConfig}.
 */
export type AppConfig = Record<string, never>;
