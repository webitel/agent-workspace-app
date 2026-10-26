<template>
	<div class="contact-create-form">
		comming soon (WS-82 US_07.06. Картка Контакту. Створити контакт)
		<wt-button
			:color="ButtonColor.SECONDARY"
			@click="emit('cancel')"
		>
			{{ t('reusable.cancel') }}
		</wt-button>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { ButtonColor } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';

const emit = defineEmits<{
	cancel: [];
}>();

const { t } = useI18n();
</script>