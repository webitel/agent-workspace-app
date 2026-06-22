<template>
    <wt-app-header>
      <wt-logo
        :logo-href="startPageHref"
      />
      <wt-chip :color="isPhoneReg ? 'success' : 'primary'">
        {{ t('header.sip') }}
      </wt-chip>
      <user-dnd-switcher />
    </wt-app-header>
</template>

<script setup lang="ts">
import { WtAppHeader, WtChip, WtLogo } from '@webitel/ui-sdk/components';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useClientHandlersStore } from '../../../features/client-handlers/store/client-handlers';
import UserDndSwitcher from './user-dnd-switcher.vue';

const { t } = useI18n();

const startPageHref = computed(() => import.meta.env.VITE_START_PAGE_URL);

const clientHandlersStore = useClientHandlersStore();
const { isPhoneReg } = storeToRefs(clientHandlersStore);
</script>

<style scoped>

</style>
