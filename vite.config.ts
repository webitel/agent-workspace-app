import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
	base: '/agent-workspace',
	build: {
		sourcemap: import.meta.env.VITE_STAGING_ENV,
		minify: !import.meta.env.VITE_STAGING_ENV, // Disable minification for readable debugging
	},
	plugins: [
		vue(),
		vueDevTools(),
	],
	resolve: {
		alias: {
			lodash: 'lodash-es',
			'@aliasedDeps/api-services/axios': resolve(
				__dirname,
				'src/app/api/instance',
			),
		},
	},
});
