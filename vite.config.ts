import vue from '@vitejs/plugin-vue';
import { vite as vidstack } from 'vidstack/plugins';
import { defineConfig, loadEnv } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const isStagingEnv = env.VITE_STAGING_ENV === 'true';

	/**
	 * Playwright's `live` project runs the app from localhost against a real
	 * instance, and that instance only allows CORS preflights from its own
	 * origin. Proxying keeps the API same-origin for the browser.
	 */
	const e2eProxy =
		mode === 'e2e' && env.E2E_API_ORIGIN
			? {
					'/api': {
						target: env.E2E_API_ORIGIN,
						changeOrigin: true,
					},
					'/chat': {
						target: env.E2E_API_ORIGIN,
						changeOrigin: true,
					},
				}
			: undefined;

	return defineConfig({
		base: '/agent-workspace',
		build: {
			sourcemap: isStagingEnv,
			minify: !isStagingEnv, // Disable minification for readable debugging
		},
		optimizeDeps: {
			// CommonJS-only packages that @webitel/ui-sdk imports without declaring;
			// force pre-bundling so the default-export interop works.
			include: [
				'clipboard-copy',
				'deep-copy',
				'deep-equal',
				'deepmerge',
				// only ever loaded lazily, which the dependency scan doesn't follow: found
				// at runtime instead, it re-optimizes and reloads the page mid-boot
				'jszip',
				// the players in @webitel/ui-sdk import vidstack through several entry
				// points; pre-bundled apart, they become separate vidstack copies whose
				// `media-*` elements can't attach to each other, so the video player's
				// controls stay dead (WS-175)
				'vidstack',
				'vidstack/player',
				'vidstack/player/ui',
				'vidstack/elements',
			],
		},
		server: {
			proxy: e2eProxy,
		},
		preview: {
			proxy: e2eProxy,
		},
		plugins: [
			vue({
				template: {
					compilerOptions: {
						isCustomElement: (tag) => tag.startsWith('media-'),
					},
				},
			}),
			vidstack(),
			vueDevTools(),
		],
		resolve: {
			// Linked @webitel/* packages pull their own vue / vue-i18n / vue-router;
			// force a single copy so types and runtime stay compatible.
			dedupe: [
				'vue',
				'vue-i18n',
				'vue-router',
				'pinia',
				'vidstack',
			],
			alias: {
				lodash: 'lodash-es',
			},
		},
	});
};
