<template>
	<div class="active-call-numpad">
		<wt-input-text
			class="active-call-numpad__input"
			:model-value="sentDigits"
			disabled
		/>

		<numpad-keys @digit="onDigit" />
	</div>
</template>

<script
	setup
	lang="ts"
>
import { WtInputText } from '@webitel/ui-sdk/components';
import { ref } from 'vue';

import NumpadKeys from '../../numpad/components/numpad-keys.vue';

const emit = defineEmits<{
	digit: [
		digit: string,
	];
}>();

const sentDigits = ref('');

function onDigit(digit: string) {
	sentDigits.value += digit;
	emit('digit', digit);
}
</script>

<style scoped>
.active-call-numpad {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.active-call-numpad__input :deep(.wt-input-text__input) {
	text-align: center;
}
</style>
