import { createI18n } from 'vue-i18n';

import { LocaleStorageKey } from '../enums/LocaleStorageKey.enum';
import { getStoredLocale } from '../scripts/getStoredLocale';
import en from './en/en';
import es from './es/es';
import kz from './kz/kz';
import pl from './pl/pl';
import ro from './ro/ro';
import ru from './ru/ru';
import uk from './uk/uk';
import uz from './uz/uz';
import vi from './vi/vi';

const messages = {
	en,
	es,
	ro,
	kz,
	pl,
	ru,
	uk,
	uz,
	vi,
};

const DEFAULT_LOCALE = 'en';
const availableLocales = Object.keys(messages);

export default createI18n({
	locale: getStoredLocale(
		LocaleStorageKey.Locale,
		availableLocales,
		DEFAULT_LOCALE,
	),
	fallbackLocale: getStoredLocale(
		LocaleStorageKey.FallbackLocale,
		availableLocales,
		DEFAULT_LOCALE,
	),
	messages,
});
