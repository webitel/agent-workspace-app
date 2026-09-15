import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { WsPageTab } from '../../../components/ws-page-wrapper.vue';

export const useContactsTabs = () => {
	const { t } = useI18n();

	const tabs = computed<WsPageTab[]>(() => [
		{
			text: t('objects.contact', 2),
			value: 'contacts',
			pathName: 'contacts',
		},
		{
			text: t('objects.user', 2),
			value: 'users',
			pathName: 'users',
		},
	]);

	return {
		tabs,
	};
};
