<template>
	<div class="the-numpad">
		<wt-input-text
			ref="numberInput"
			v-model="number"
			class="the-numpad__input"
			@keyup.enter="onCall"
		/>

		<numpad-keys @digit="appendDigit" />

		<wt-button
			:color="ButtonColor.SUCCESS"
			:size="ComponentSize.SM"
			wide
			:disabled="!canCall"
			@click="onCall"
		>
			{{ t('ui.numpad.call') }}
		</wt-button>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { WtButton, WtInputText } from '@webitel/ui-sdk/components';
import { ButtonColor, ComponentSize } from '@webitel/ui-sdk/enums';
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

import NumpadKeys from './numpad-keys.vue';

const props = withDefaults(
	defineProps<{
		initialNumber?: string;
	}>(),
	{
		initialNumber: '',
	},
);

const emit = defineEmits<{
	call: [
		destination: string,
	];
}>();

const { t } = useI18n();

const number = ref(props.initialNumber);

const numberInput =
	useTemplateRef<InstanceType<typeof WtInputText>>('numberInput');

const canCall = computed(() => number.value.trim().length > 0);

function focusNumberInput() {
	numberInput.value?.focus();
}

function appendDigit(digit: string) {
	number.value += digit;
	focusNumberInput();
}

function onCall() {
	if (!canCall.value) return;
	emit('call', number.value.trim());
}

onMounted(focusNumberInput);
</script>

<style scoped>
.the-numpad {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    width: 280px;
    padding: var(--spacing-sm);
}

/* wt-input-text has no alignment prop; the dialled number is centred as in cc-workspaces. */
.the-numpad__input :deep(.wt-input-text__input) {
    text-align: center;
}
</style>
