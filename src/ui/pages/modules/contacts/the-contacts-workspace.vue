<template>
	<ws-page-wrapper
		class="the-contacts-workspace"
		:tabs="tabs"
	>
		<template #actions-panel>
			<router-view name="actions" />
		</template>
		<template #main>
			<router-view />
		</template>
	</ws-page-wrapper>
</template>

<script setup lang="ts">
import WsPageWrapper from '../../components/ws-page-wrapper.vue';
import { useI18n } from "vue-i18n";

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
</script>
