<template>
	<div class="numpad-keys">
		<wt-button
			v-for="key in NUMPAD_KEYS"
			:key="key"
			class="numpad-keys__key"
			:color="ButtonColor.SECONDARY"
			:variant="ButtonVariant.OUTLINED"
			:size="ComponentSize.SM"
			@click="emit('digit', key)"
		>
			{{ key }}
		</wt-button>
	</div>
</template>

<script
	setup
	lang="ts"
>
import { WtButton } from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
} from '@webitel/ui-sdk/enums';

import { NUMPAD_KEYS } from '../constants/numpadKeys';

const emit = defineEmits<{
	digit: [
		digit: string,
	];
}>();
</script>

<style scoped>
.numpad-keys {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--wt-ws-dialer-sizes-numpad-gap);
}

.numpad-keys__key {
	justify-content: center;
}

/**
 * @author Oleksandr Palonnyi
 * "+" sits alone in the last row and is centred under "0" in the design
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
.numpad-keys__key:last-child {
	grid-column: 2;
}
</style>
