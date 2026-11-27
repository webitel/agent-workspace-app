import { afterEach, describe, expect, it } from 'vitest';

import { LocaleStorageKey } from '../../enums/LocaleStorageKey.enum';
import { getStoredLocale } from '../getStoredLocale';

const AVAILABLE_LOCALES = [
	'en',
	'uk',
	'ru',
];

describe('getStoredLocale', () => {
	afterEach(() => {
		localStorage.clear();
	});

	it('returns the locale chosen in the Settings app', () => {
		localStorage.setItem('lang', 'uk');

		expect(
			getStoredLocale(LocaleStorageKey.Locale, AVAILABLE_LOCALES, 'en'),
		).toBe('uk');
	});

	it('returns the fallback locale chosen in the Settings app', () => {
		localStorage.setItem('lang', 'uk');
		localStorage.setItem('fallbackLang', 'ru');

		expect(
			getStoredLocale(LocaleStorageKey.FallbackLocale, AVAILABLE_LOCALES, 'en'),
		).toBe('ru');
	});

	it('returns the default when nothing is stored under the key', () => {
		localStorage.setItem('lang', 'uk');

		expect(
			getStoredLocale(LocaleStorageKey.FallbackLocale, AVAILABLE_LOCALES, 'en'),
		).toBe('en');
	});

	it('returns the default when the stored locale has no messages', () => {
		localStorage.setItem('lang', 'de');

		expect(
			getStoredLocale(LocaleStorageKey.Locale, AVAILABLE_LOCALES, 'en'),
		).toBe('en');
	});
});
