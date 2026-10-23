<template>
	<div class="call-dock-numpad">
		<wt-input-text
			class="call-dock-numpad__input"
			:model-value="digits"
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

import NumpadKeys from '../../../../numpad/components/numpad-keys.vue';

defineProps<{
	digits: string;
}>();

const emit = defineEmits<{
	digit: [
		digit: string,
	];
}>();

function onDigit(digit: string) {
	emit('digit', digit);
}
</script>

<style scoped>
.call-dock-numpad {
	display: flex;
	flex-direction: column;
	gap: var(--wt-ws-call-dock-sizes-root-gap);
}

.call-dock-numpad__input :deep(.wt-input-text__input) {
	text-align: center;
}
</style>
