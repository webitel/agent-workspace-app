import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const isStagingEnv = !!env.VITE_STAGING_ENV;

	return defineConfig({
		base: '/agent-workspace',
		build: {
			sourcemap: isStagingEnv,
			minify: !isStagingEnv, // Disable minification for readable debugging
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
				'@aliasedDeps/api-services/axios': resolve(
					__dirname,
					'src/app/api/instance',
				),
			},
		},
	});
};
