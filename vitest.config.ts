import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// vite.config exports a ({ mode }) => config callback, which mergeConfig can't
// merge directly — resolve it for the env first, then merge.
export default defineConfig((configEnv) =>
	mergeConfig(
		viteConfig(configEnv),
		defineConfig({
			test: {
				globals: true,
				environment: 'jsdom',
				setupFiles: [
					'test/setup.ts',
				],
				server: {
					deps: {
						/**
						 * `@webitel/*` packages ship raw `.ts` sources, which node
						 * refuses to type-strip inside node_modules. Inline them so
						 * vite transforms them instead.
						 */
						inline: [
							/@webitel\//,
						],
					},
				},
				exclude: [
					...configDefaults.exclude,
					'e2e/**',
				],
				root: fileURLToPath(new URL('./', import.meta.url)),
			},
		}),
	),
);
