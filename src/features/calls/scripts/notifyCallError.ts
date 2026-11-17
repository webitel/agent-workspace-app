import { eventBus } from '@webitel/ui-sdk/scripts';

import i18n from '../../../app/locale/i18n';

export type CallErrorKey = 'holdToggleFailed' | 'dtmfFailed' | 'transferFailed';

export function notifyCallError(errorKey: CallErrorKey): void {
	eventBus.$emit('notification', {
		type: 'error',
		text: i18n.global.t(`error.calls.${errorKey}`),
	});
}
