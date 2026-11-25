<template>
	<form
		class="contact-card-communication-add-form"
		@submit.prevent="submit"
	>
		<wt-input-text
			v-model="draft[valueField]"
			:label="valueLabel"
			:placeholder="valueLabel"
			:regle-validation="r$.$fields[valueField]"
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
				@click="submit"
			/>
		</div>
	</form>
</template>

<script setup lang="ts">
import { useRegleSchema } from '@regle/schemas';
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
	type AddableCommunicationTab,
	communicationSchema,
	communicationValueField,
	loadCommunicationTypes,
	type NewCommunication,
} from './scripts/contactCommunicationAdd';

/**
 * @author Polina Sukhorukova
 * The inline form for a new phone or email on its tab (AC_07.07.08,
 * AC_07.07.09); it only checks what is typed and hands it over, the section
 * saves it, so a save outlives the form when the agent switches tabs
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const props = defineProps<{
	tab: AddableCommunicationTab;
	/** a record from this form is being saved */
	isSaving: boolean;
}>();

const emit = defineEmits<{
	submit: [
		record: NewCommunication,
	];
	cancel: [];
}>();

const { t } = useI18n();

/** the form lives on one tab: switching it closes the form */
const valueField = communicationValueField(props.tab);

const draft = ref<NewCommunication>({
	[valueField]: '',
});

/**
 * @author Polina Sukhorukova
 * Checked against the same api-services schema CRM uses for a new phone or
 * email; regle gives both the validity and the value field's error text. The
 * type select shows no error: it cannot be cleared once picked, so a missing
 * type only keeps save disabled
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const { r$ } = useRegleSchema(draft, communicationSchema(props.tab), {
	autoDirty: true,
});

const valueLabel = computed(() =>
	props.tab === 'phones'
		? t('ui.reusable.phoneNumber')
		: t('vocabulary.emails', 1),
);

const canSave = computed(() => !props.isSaving && !r$.$invalid);

const searchTypes = (params: Record<string, unknown>) =>
	loadCommunicationTypes(props.tab, params);

function submit() {
	if (!canSave.value) return;
	emit('submit', {
		...draft.value,
	});
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
