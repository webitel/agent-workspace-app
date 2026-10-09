<template>
	<div class="active-call-numpad">
		<wt-input-text
			class="active-call-numpad__input"
			:model-value="sentDigits"
			disabled
		/>

		<div class="active-call-numpad__keys">
			<wt-button
				v-for="key in NUMPAD_KEYS"
				:key="key"
				class="active-call-numpad__key"
				color="secondary"
				variant="outlined"
				size="sm"
				@click="onKeyClick(key)"
			>
				{{ key }}
			</wt-button>
		</div>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { WtButton, WtInputText } from '@webitel/ui-sdk/components';
import { ref } from 'vue';

import { NUMPAD_KEYS } from '../../numpad/constants/numpadKeys';

const emit = defineEmits<{
	digit: [
		digit: string,
	];
}>();

const sentDigits = ref('');

function onKeyClick(digit: string) {
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

.active-call-numpad__keys {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--spacing-2xs);
}

.active-call-numpad__key {
	justify-content: center;
}

/**
 * @author Oleksandr Palonnyi
 * "+" sits alone in the last row and is centred under "0", as in the dialer numpad
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
.active-call-numpad__key:last-child {
	grid-column: 2;
}
</style>
