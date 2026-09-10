<template>
	<wt-switcher
		:label="t('ui.header.dnd.label')"
		:model-value="isDnd"
		@update:model-value="toggleUserDnd"
	>
		<template #label="{ label }">
			{{ label }}
			<wt-hint>{{ t('ui.header.dnd.tooltip') }}</wt-hint>
		</template>
	</wt-switcher>
</template>

<script setup lang="ts">
import { WtHint, WtSwitcher } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useUserStatusStore } from '../../../features/user-status/store/userStatus';

const { t } = useI18n();
const userStatusStore = useUserStatusStore();
const { isDnd } = storeToRefs(userStatusStore);
const { toggleUserDnd } = userStatusStore;
</script>

<style scoped>

</style>
