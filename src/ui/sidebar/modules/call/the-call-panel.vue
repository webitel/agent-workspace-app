<template>
	<div class="call-panel">
		<call-info-panel :content="content" />
		<contact-create-form
			v-if="isCreateFormOpen"
			@cancel="closeCreateForm"
		/>
		<template v-else-if="!isContactHidden">
			<contact-identification
				:contact-ids="contactIds"
				:is-loading="isLoading"
			/>
			<!-- not while the call is ringing: there is nothing to link a new contact to yet -->
			<wt-button
				v-if="props.call.answeredAt"
				class="call-panel__create"
				@click="openCreateForm"
			>
				{{ t('reusable.create') }}
			</wt-button>
		</template>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Call } from 'webitel-sdk';
import CallInfoPanel from '../../../../features/calls/components/call-info-panel/call-info-panel.vue';
import { useCallContactIdentification } from '../../../../features/calls/composables/useCallContactIdentification';
import { toCallInfoPanelContent } from '../../../../features/calls/scripts/toCallInfoPanelContent';
import ContactCreateForm from '../../components/contact/contact-create-form.vue';
import ContactIdentification from '../../components/contact/contact-identification.vue';

// The call open on the page; the sidebar shows this panel only while it exists.
const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();

const content = computed(() => toCallInfoPanelContent(props.call));

const { contactIds, isLoading, isContactHidden } = useCallContactIdentification(
	() => props.call,
);

const isCreateFormOpen = ref(false);

function openCreateForm() {
	isCreateFormOpen.value = true;
}

function closeCreateForm() {
	isCreateFormOpen.value = false;
}

// a form left open must not carry over to another call
watch(() => props.call.id, closeCreateForm);
</script>

<style scoped>
.call-panel {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.call-panel__create {
	align-self: center;
}
</style>
