<template>
	<form
		class="contact-card-communication-add-form"
		@submit.prevent="save"
	>
		<wt-input-text
			v-model="draft.value"
			:label="valueLabel"
			:placeholder="valueLabel"
			:v="valueValidation"
		/>

		<wt-single-select
			v-model="draft.type"
			:label="t('objects.communicationType', 1)"
			:placeholder="t('objects.communicationType', 1)"
			:search-method="searchTypes"
			option-label="name"
			data-key="id"
		/>

		<div class="contact-card-communication-add-form__actions">
			<wt-button
				icon="close"
				:size="ComponentSize.SM"
				:color="ButtonColor.SECONDARY"
				:variant="ButtonVariant.OUTLINED"
				:aria-label="t('reusable.cancel')"
				@click="emit('cancel')"
			/>
			<wt-button
				icon="tick"
				:size="ComponentSize.SM"
				:color="ButtonColor.SECONDARY"
				:variant="ButtonVariant.OUTLINED"
				:disabled="!canSave"
				:aria-label="t('reusable.save')"
				@click="save"
			/>
		</div>
	</form>
</template>

<script setup lang="ts">
import {
	WtButton,
	WtInputText,
	WtSingleSelect,
} from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
} from '@webitel/ui-sdk/enums';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
	type AddableCommunicationTab,
	addCommunication,
	type CommunicationDraft,
	isInvalidCommunicationValue,
	isValidCommunicationDraft,
	loadCommunicationTypes,
} from './scripts/contactCommunicationAdd';

/**
 * @author Polina Sukhorukova
 * Adds a phone or an email to the contact, inline on its tab
 * (AC_07.07.08, AC_07.07.09)
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const props = defineProps<{
	tab: AddableCommunicationTab;
	contactId: string;
	/** the tab has no records yet, so the new one becomes primary */
	isFirst: boolean;
}>();

const emit = defineEmits<{
	saved: [];
	cancel: [];
}>();

const { t } = useI18n();

const draft = reactive<CommunicationDraft>({
	value: '',
	type: null,
});

const isSaving = ref(false);

const valueLabel = computed(() =>
	props.tab === 'phones'
		? t('ui.reusable.phoneNumber')
		: t('vocabulary.emails', 1),
);

/**
 * @author Polina Sukhorukova
 * wt-input-text reads a vuelidate-shaped field: only the email format can be
 * broken by a non-empty value, and ui-sdk words it as `validation.email`
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const valueValidation = computed(() => {
	const invalid = isInvalidCommunicationValue(props.tab, draft.value);
	return {
		$error: invalid,
		email: {
			$invalid: invalid,
		},
	};
});

const canSave = computed(
	() => !isSaving.value && isValidCommunicationDraft(props.tab, draft),
);

const searchTypes = (params: Record<string, unknown>) =>
	loadCommunicationTypes(props.tab, params);

async function save() {
	if (!canSave.value) return;
	isSaving.value = true;
	try {
		await addCommunication(props.tab, props.contactId, draft, {
			primary: props.isFirst,
		});
		emit('saved');
	} catch {
		// notified by api-services; the form keeps what the agent typed
	} finally {
		isSaving.value = false;
	}
}
</script>

<style scoped>
.contact-card-communication-add-form {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-card-communication-add-form__actions {
	display: flex;
	justify-content: center;
	gap: var(--spacing-sm);
}
</style>
