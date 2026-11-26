<template>
	<form
		class="contact-create-form"
		@submit.prevent="submit"
	>
		<div class="contact-create-form__fields">
			<wt-input-text
				v-model="draft.name"
				:label="t('reusable.name')"
				:regle-validation="r$.$fields.name"
			/>
			<wt-input-text
				v-model="draft.phoneNumber"
				:label="t('ui.reusable.phoneNumber')"
			/>
			<wt-input-text
				v-model="draft.email"
				:label="t('vocabulary.emails', 1)"
				:regle-validation="r$.$fields.email"
			/>
			<wt-single-select
				v-model="draft.timezone"
				:label="t('date.timezone', 1)"
				:search-method="CalendarsAPI.getTimezonesLookup"
				option-label="name"
				data-key="id"
			/>
			<wt-single-select
				v-model="draft.owner"
				:label="t('objects.owner', 1)"
				:search-method="UsersAPI.getLookup"
				option-label="name"
				data-key="id"
			/>
			<wt-multi-select
				v-model="draft.labels"
				:label="t('vocabulary.labels', 2)"
				:placeholder="t('vocabulary.labels', 1)"
				:search-method="LabelsAPI.getLookup"
				option-label="label"
				data-key="label"
				allow-custom-values
				chips-view
			/>
			<wt-textarea
				v-model="draft.description"
				:label="t('vocabulary.description')"
			/>
		</div>

		<div class="contact-create-form__actions">
			<wt-button
				:disabled="!canSave"
				:loading="isSaving"
				@click="submit"
			>
				{{ t('reusable.save') }}
			</wt-button>
			<wt-button
				:color="ButtonColor.SECONDARY"
				:disabled="isSaving"
				@click="emit('cancel')"
			>
				{{ t('reusable.cancel') }}
			</wt-button>
		</div>
	</form>
</template>

<script setup lang="ts">
import { useRegleSchema } from '@regle/schemas';
import { CalendarsAPI, LabelsAPI, UsersAPI } from '@webitel/api-services/api';
import { contactEmailSchema } from '@webitel/api-services/validations';
import {
	WtButton,
	WtInputText,
	WtMultiSelect,
	WtSingleSelect,
	WtTextarea,
} from '@webitel/ui-sdk/components';
import { ButtonColor } from '@webitel/ui-sdk/enums';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';
import { useUserinfoStore } from '../../../../features/userinfo/stores/userinfoStore';
import type { NewContactDraft } from './contact-create-form.types';

/**
 * @author Oleksandr Palonnyi
 * While saving, CANCEL is disabled as well as SAVE: the request cannot be taken
 * back, so cancelling then would close the form over a contact that is created
 * anyway and, in a call, linked to it (ADR-0031)
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
const props = defineProps<{
	isSaving: boolean;
}>();

const emit = defineEmits<{
	submit: [
		draft: NewContactDraft,
	];
	cancel: [];
}>();

const { t } = useI18n();

const { userId, userInfo } = storeToRefs(useUserinfoStore());

/**
 * @author Oleksandr Palonnyi
 * The owner starts as the agent who pressed CREATE (AC_07.06.02); it can be
 * cleared, and a contact without one is saved without a manager
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
const draft = ref<NewContactDraft>({
	name: '',
	phoneNumber: '',
	email: '',
	timezone: null,
	owner: userId.value
		? {
				id: String(userId.value),
				name: userInfo.value?.name,
			}
		: null,
	labels: [],
	description: '',
});

/**
 * @author Oleksandr Palonnyi
 * Only the name is required (AC_07.06.03). A typed email is checked by the
 * same rule CRM and the contact card's add form use, so an address the card
 * would refuse is not created here either; the phone has no format rule there.
 * The email is checked trimmed, as it is sent
 * [WS-82](https://webitel.atlassian.net/browse/WS-82) [NWS][FE] US_07.06. Картка Контакту. Створити контакт
 */
const draftSchema = z.object({
	name: z.string().trim().min(1),
	email: z
		.string()
		.trim()
		.superRefine((email, context) => {
			if (!email) return;
			const { error } = contactEmailSchema.shape.email.safeParse(email);
			for (const { message } of error?.issues ?? []) context.addIssue(message);
		}),
});

const { r$ } = useRegleSchema(draft, draftSchema, {
	autoDirty: true,
});

const canSave = computed(() => !props.isSaving && !r$.$invalid);

function submit() {
	if (!canSave.value) return;
	emit('submit', {
		...draft.value,
	});
}
</script>

<style scoped>
.contact-create-form {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

.contact-create-form__fields {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-create-form__actions {
	display: flex;
	justify-content: center;
	gap: var(--spacing-xs);
}
</style>
