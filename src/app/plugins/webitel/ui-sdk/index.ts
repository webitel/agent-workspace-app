import '@webitel/ui-sdk/dist/ui-sdk.css';
import * as locales from '@webitel/ui-sdk/locale';

import i18n from '../../../locale/i18n';

Object.entries(locales).forEach(([locale, messages]) => {
	i18n.global.mergeLocaleMessage(locale, messages);
});
