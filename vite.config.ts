import vue from '@vitejs/plugin-vue';
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
				'deep-equal',
				'deepmerge',
				'jszip',
				'jszip-utils',
			],
		},
		server: {
			proxy: e2eProxy,
		},
		preview: {
			proxy: e2eProxy,
		},
		plugins: [
			vue(),
			vueDevTools(),
		],
		resolve: {
			// Linked @webitel/* packages pull their own vue / vue-i18n / vue-router;
			// force a single copy so types and runtime stay compatible.
			dedupe: [
				'vue',
				'vue-i18n',
				'vue-router',
			],
			alias: {
				lodash: 'lodash-es',
			},
		},
	});
};
