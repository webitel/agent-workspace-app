<template>
	<div class="the-numpad">
		<wt-input-text
			v-model="number"
			class="the-numpad__input"
			@keyup.enter="onCall"
		/>

		<div class="the-numpad__keys">
			<wt-button
				v-for="key in keys"
				:key="key"
				class="the-numpad__key"
				color="secondary"
				variant="outlined"
				size="sm"
				@click="appendDigit(key)"
			>
				{{ key }}
			</wt-button>
		</div>

		<wt-button
			class="the-numpad__call"
			color="success"
			size="sm"
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
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

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

const keys = [
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'*',
	'0',
	'#',
	'+',
];

const { t } = useI18n();

const number = ref(props.initialNumber);

const canCall = computed(() => number.value.trim().length > 0);

function appendDigit(digit: string) {
	number.value += digit;
}

function onCall() {
	if (!canCall.value) return;
	emit('call', number.value.trim());
}
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

.the-numpad__keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2xs);
}

.the-numpad__key {
    justify-content: center;
}

/* "+" sits alone in the last row and is centred under "0" in the design. */
.the-numpad__key:last-child {
    grid-column: 2;
}
</style>
