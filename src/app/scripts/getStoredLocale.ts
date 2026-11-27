import type { LocaleStorageKey } from '../enums/LocaleStorageKey.enum';

export const getStoredLocale = (
	storageKey: LocaleStorageKey,
	availableLocales: readonly string[],
	defaultLocale: string,
): string => {
	const storedLocale = localStorage.getItem(storageKey);

	return storedLocale && availableLocales.includes(storedLocale)
		? storedLocale
		: defaultLocale;
};
