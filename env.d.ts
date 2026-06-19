/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_STAGING_ENV: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
