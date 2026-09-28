/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_STAGING_ENV: string;
	readonly VITE_CHAT_WEB_SOCKET_URL: string;
	readonly VITE_CRM_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
