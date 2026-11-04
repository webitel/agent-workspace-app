<template>
	<div class="contact-card-unknown">
		<wt-avatar
			:size="ComponentSize.SM"
			:src="unknownContactAvatar"
		/>
		<p class="contact-card-unknown__name typo-body-2-bold">
			{{ t('ui.clientIdentity.unknownContact') }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { useI18n } from 'vue-i18n';
import unknownContactAvatar from '../../../../app/assets/ws-unknown-contact-avatar.svg';

const { t } = useI18n();
</script>

<style scoped>
.contact-card-unknown {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.contact-card-unknown__name {
	margin: 0;
}
</style>
