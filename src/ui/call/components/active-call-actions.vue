<template>
	<div class="active-call-actions">
		<wt-button
			v-for="action in actions"
			:key="action.id"
      :icon="action.icon"
      :size="ComponentSize.SM"
      :icon-color="action.isActive ? IconColor.ACTIVE : action.iconColor"
			:color="action.buttonColor"
			:variant="getActionVariant(action.isActive)"
			:aria-label="action.label"
			:aria-pressed="action.isToggle ? action.isActive : undefined"
			width-by-content
			@click="action.onClick"
		/>
	</div>
</template>

<script
	setup
	lang="ts"
>
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
	IconColor,
} from '@webitel/ui-sdk/enums';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

interface ActiveCallAction {
	id: string;
	icon: string;
	label: string;
	size: ComponentSize;
	buttonColor: ButtonColor;
	iconColor: IconColor;
	isActive: boolean;
	isToggle: boolean;
	onClick: () => void;
}

const props = defineProps<{
	isNumpadOpen: boolean;
	isMuted: boolean;
	isHold: boolean;
}>();

const emit = defineEmits<{
	toggleNumpad: [];
	toggleMute: [];
	toggleHold: [];
	hangup: [];
}>();

const { t } = useI18n();

/**
 * @author Oleksandr Palonnyi
 * transfer has no SDK action yet, so its active state is only this local
 * toggle; mute and hold are not mirrored here because the preview already
 * carries their real state
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const isTransferActive = ref(false);

/**
 * @author Oleksandr Palonnyi
 * wt-button has no active prop, so an active action is marked by switching
 * the button from the text to the filled (ButtonVariant.ACTIVE) variant
 * [WS-23](https://webitel.atlassian.net/browse/WS-23)
 */
const getActionVariant = (isActive: boolean): ButtonVariant =>
	isActive ? ButtonVariant.ACTIVE : ButtonVariant.TEXT;

const actions = computed<ActiveCallAction[]>(() => [
	{
		id: 'numpad',
		icon: 'numpad',
		label: t('ui.call.activeCall.actions.numpad'),
		size: ComponentSize.SM,
		buttonColor: ButtonColor.SECONDARY,
		iconColor: IconColor.DEFAULT,
		isActive: props.isNumpadOpen,
		isToggle: true,
		onClick: () => emit('toggleNumpad'),
	},
	{
		id: 'mute',
		icon: props.isMuted ? 'mic-muted' : 'mic',
		label: t('ui.call.activeCall.actions.mute'),
		size: ComponentSize.SM,
		buttonColor: ButtonColor.SECONDARY,
		iconColor: IconColor.DEFAULT,
		isActive: props.isMuted,
		isToggle: true,
		onClick: () => emit('toggleMute'),
	},
	{
		id: 'hold',
		icon: 'hold',
		label: t('ui.call.activeCall.actions.hold'),
		size: ComponentSize.SM,
		buttonColor: ButtonColor.SECONDARY,
		iconColor: IconColor.DEFAULT,
		isActive: props.isHold,
		isToggle: true,
		onClick: () => emit('toggleHold'),
	},
	{
		id: 'transfer',
		icon: 'call-transfer--filled',
		label: t('ui.call.activeCall.actions.transfer'),
		size: ComponentSize.MD,
		buttonColor: ButtonColor.TRANSFER,
		iconColor: IconColor.TRANSFER,
		isActive: isTransferActive.value,
		isToggle: true,
		onClick: () => {
			isTransferActive.value = !isTransferActive.value;
		},
	},
	{
		id: 'hangup',
		icon: 'call-end--filled',
		label: t('ui.call.activeCall.actions.hangup'),
		size: ComponentSize.SM,
		buttonColor: ButtonColor.ERROR,
		iconColor: IconColor.ERROR,
		isActive: false,
		isToggle: false,
		onClick: () => emit('hangup'),
	},
]);
</script>

<style scoped>
.active-call-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
</style>
