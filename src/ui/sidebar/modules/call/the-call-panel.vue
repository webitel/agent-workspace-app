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
				:can-select="isCallActive"
				@select="selectContact"
			>
				<template #actions>
					<wt-button
						v-if="isCallActive"
						@click="openCreateForm"
					>
						{{ t('reusable.create') }}
					</wt-button>
				</template>
			</contact-identification>
		</template>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { type Call, CallActions } from 'webitel-sdk';
import { useCallContactIdentification } from '../../../../features/calls/modules/contact/composables/useCallContactIdentification';
import CallInfoPanel from '../../../../features/calls/modules/info/components/call-info-panel/call-info-panel.vue';
import { toCallInfoPanelContent } from '../../../../features/calls/modules/info/scripts/toCallInfoPanelContent';
import ContactCreateForm from '../../components/contact/contact-create-form.vue';
import ContactIdentification from '../../components/contact/contact-identification.vue';

// The call open on the page; the sidebar shows this panel only while it exists.
const props = defineProps<{
	call: Call;
}>();

const { t } = useI18n();

const content = computed(() => toCallInfoPanelContent(props.call));

const { contactIds, isLoading, isContactHidden, selectContact } =
	useCallContactIdentification(() => props.call);

// contacts are created and linked only while the call is live, as in
// cc-workspaces: not while ringing, nor after hangup
const isCallActive = computed(
	() =>
		props.call.state === CallActions.Active ||
		props.call.state === CallActions.Hold,
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
	gap: var(--spacing-xs);
}
</style>
