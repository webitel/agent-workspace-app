<template>
	<wt-switcher
		:label="t('header.dnd.label')"
		:model-value="isDnd"
		@update:model-value="toggleUserDND"
	/>
</template>

<script setup lang="ts">
import { WtSwitcher } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import UserStatus from '../../../features/user/enums/UserStatus';
import { useUserStore } from '../../../features/user/store/user';

const { t } = useI18n();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const { toggleUserDND } = userStore;

const isDnd = computed(() => !!user.value?.status?.[UserStatus.DND]);
</script>

<style scoped>

</style>
