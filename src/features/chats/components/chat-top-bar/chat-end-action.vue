<template>
	<div class="chat-end-action">
		<wt-tooltip>
			<template #activator>
				<div>
					<wt-button
						:loading="isEnding"
						:aria-label="t('ui.pages.chats.topBar.end')"
						color="error"
						variant="outlined"
						icon="chat-end--filled"
						rounded
						@click="isConfirming = true"
					/>
				</div>
			</template>
			{{ t('ui.pages.chats.topBar.end') }}
		</wt-tooltip>

		<wt-confirm-dialog
			v-if="isConfirming"
			:callback="callback"
			:delete-message="t('ui.pages.chats.topBar.endConfirmMessage')"
			:title="t('ui.pages.chats.topBar.endConfirmTitle')"
			@close="isConfirming = false"
		>
			<template #actions="{ isDeleting, confirm, close }">
				<wt-button
					:disabled="isDeleting"
					color="secondary"
					@click="close"
				>
					{{ t('reusable.cancel') }}
				</wt-button>
				<wt-button
					:loading="isDeleting"
					color="error"
					@click="confirm"
				>
					{{ t('ui.pages.chats.topBar.end') }}
				</wt-button>
			</template>
		</wt-confirm-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
	// awaited by the confirmation, which shows its own progress meanwhile
	callback: () => Promise<void>;
	// stays on after the request resolves: the backend flips the task's state
	// only later, and the button must not fire a second request in between
	isEnding: boolean;
}>();

const { t } = useI18n();

const isConfirming = ref(false);
</script>
