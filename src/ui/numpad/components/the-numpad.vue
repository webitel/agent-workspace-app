<template>
	<div class="the-numpad">
		<wt-input-text
			v-model="number"
			class="the-numpad__input"
			:placeholder="t('ui.numpad.placeholder')"
			size="lg"
			@keyup.enter="onCall"
		/>

		<div class="the-numpad__keys">
			<wt-button
				v-for="key in keys"
				:key="key"
				class="the-numpad__key"
				color="secondary"
				variant="outlined"
				size="lg"
				@click="appendDigit(key)"
			>
				{{ key }}
			</wt-button>
		</div>

		<wt-button
			class="the-numpad__call"
			color="success"
			size="lg"
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

const number = ref('');

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
    gap: var(--spacing-sm);
    width: 240px;
    padding: var(--spacing-sm);
}

.the-numpad__keys {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);
}

.the-numpad__key {
    justify-content: center;
}
</style>
