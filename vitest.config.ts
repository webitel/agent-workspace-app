import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config';
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
				exclude: [
					...configDefaults.exclude,
					'e2e/**',
				],
				root: fileURLToPath(new URL('./', import.meta.url)),
			},
		}),
	),
);
