import { acceptHMRUpdate, defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { QueueTypeName } from '@webitel/ui-sdk/enums';
import { VideoMediaFlow } from 'webitel-sdk';

import { useWorkspaceStore } from '../../../app/stores/workspace';
import { getConfig } from '../../appConfig/config';
import { useWebSocketClient } from '../../../app/api/socket/composables/useWebSocketClient';
import WorkspaceStates from '../../../ui/enums/WorkspaceState.enum';
import { useCallSubscription } from './composables/useCallSubscription';
import isIncomingRinging from './scripts/isIncomingRinging';
import type { CallSubscriptionStore } from '../types/CallSubscription.types';

export const useCallStore = defineStore('call', () => {
	const { getClient } = useWebSocketClient();
	const workspaceStore = useWorkspaceStore();

	const callList = ref<any[]>([]);
	const isVideo = ref(false);
	const callInfo = ref(new Map<string, any>());
	const newNumbers = ref(new Map<string, string>());

	const callOnWorkspace = computed(
		() => workspaceStore.isCallWorkspace && workspaceStore.taskOnWorkspace,
	);

	const isNewCall = computed(() => callOnWorkspace.value?._isNew);

	const currentCallDigits = computed(() => {
		if (callOnWorkspace.value?.digits?.length) {
			return callOnWorkspace.value.digits;
		}
		return '';
	});

	const isAnyRinging = computed(() =>
		callList.value.some((call) => isIncomingRinging(call)),
	);

	const isOfflineCall = computed(
		() => callOnWorkspace.value?.queue?.queue_type === QueueTypeName.OFFLINE_QUEUE,
	);

	function isVideoCall(call: any): boolean {
		return call?.remoteVideo === VideoMediaFlow.SendRecv;
	}

	const isVideoCallOnWorkspace = computed(() => isVideoCall(callOnWorkspace.value));

	function getCallById(callId: string) {
		return callList.value.find((call) => call.id === callId);
	}

	function normalizePhoneNumber(phone: string) {
		if (!phone) return '';
		return phone.replace(/[()\-\s]/g, '');
	}

	function setCallList(list: any[]) {
		callList.value = list;
	}

	function addCall(call: any) {
		callList.value.push(call);
	}

	function removeCall(removedCall: any) {
		callList.value = callList.value.filter((call) => call !== removedCall);
		if (removedCall?.id) {
			callInfo.value.delete(removedCall.id);
			newNumbers.value.delete(removedCall.id);
		}
	}

	function updateCallInfo({ callId, info }: { callId: string; info: any }) {
		if (!callId) return;
		const existing = callInfo.value.get(callId) || {};
		callInfo.value.set(callId, { ...existing, ...info });
	}

	function clearCallInfo() {
		callInfo.value = new Map();
	}

	function setVideo(value: boolean) {
		isVideo.value = value;
	}

	async function call({
		number,
		contactId,
	}: { number?: string; contactId?: string } = {}) {
		const config = getConfig() as Record<string, any>;
		const callParams = { disableStun: !config.CLI?.stun, contactId };

		const activeCall = callList.value.find((existingCall) => existingCall.active);
		if (activeCall) await setHold(activeCall);

		const workspaceTask = callOnWorkspace.value;
		let destination = number || getNewNumber(workspaceTask);
		// eslint-disable-next-line no-useless-escape
		destination = destination.replace(/[^0-9a-zA-z+*#]/g, '');

		const client = getClient();
		await client.call({
			destination,
			params: { ...callParams, video: isVideo.value },
		});
	}

	async function answer({ callId }: { callId?: string } = {}) {
		const config = getConfig() as Record<string, any>;
		const answerParams = { useAudio: true, disableStun: !config.CLI?.stun };
		const targetCall = callId ? getCallById(callId) : callOnWorkspace.value;
		if (targetCall?.allowAnswer) {
			await targetCall.answer({ ...answerParams, video: false });
			setWorkspace(targetCall);
		}
	}

	async function blindTransfer(number: string) {
		const currentCall = callOnWorkspace.value;
		try {
			await currentCall.blindTransfer(number);
		} catch {}
	}

	async function bridge(callToBridge: any) {
		const currentCall = callOnWorkspace.value;
		try {
			await currentCall.bridgeTo(callToBridge);
		} catch {}
	}

	async function toggleMute({ callId }: { callId?: string } = {}) {
		const targetCall = callId ? getCallById(callId) : callOnWorkspace.value;
		await targetCall.mute(!targetCall.muted);
	}

	async function toggleHold({ callId }: { callId?: string } = {}) {
		const targetCall = callId ? getCallById(callId) : callOnWorkspace.value;
		if (
			(!targetCall.isHold && targetCall.allowHold) ||
			(targetCall.isHold && targetCall.allowUnHold)
		) {
			try {
				await targetCall.toggleHold();
			} catch {}
		}
	}

	async function setHold(callToHold: any) {
		if (!callToHold.isHold && callToHold.allowHold) callToHold.hold();
	}

	async function sendDtmf(value: string) {
		const currentCall = callOnWorkspace.value;
		if (currentCall.allowDtmf) {
			try {
				await currentCall.sendDTMF(value);
			} catch {}
		}
	}

	async function hangup({ callId }: { callId?: string } = {}) {
		const targetCall = callId ? getCallById(callId) : callOnWorkspace.value;
		if (targetCall?.allowHangup) {
			try {
				await targetCall.hangup();
			} catch {}
		}
	}

	function openActiveCall(activeCall: any) {
		setWorkspace(activeCall);
	}

	function openNewCall({ newNumber }: { newNumber?: string } = {}) {
		setWorkspace({ _isNew: true, newNumber: newNumber || '' });
	}

	function closeNewCall() {
		resetWorkspace();
	}

	function getNewNumber(task: any): string {
		if (!task) return '';
		if ('_isNew' in task) return task.newNumber ?? '';
		return newNumbers.value.get(task.id) ?? '';
	}

	async function addDigit(value: string) {
		const currentCall = callOnWorkspace.value;
		if ((currentCall as any).allowDtmf) {
			sendDtmf(value);
		} else if ('_isNew' in (currentCall as any)) {
			(currentCall as any).newNumber = ((currentCall as any).newNumber ?? '') + value;
		} else {
			const previousValue = newNumbers.value.get((currentCall as any).id) ?? '';
			newNumbers.value.set((currentCall as any).id, previousValue + value);
		}
	}

	function setNewNumber({
		call: targetCall = callOnWorkspace.value,
		value,
	}: { call?: any; value: string }) {
		if ('_isNew' in targetCall) {
			targetCall.newNumber = value;
		} else {
			newNumbers.value.set(targetCall.id, value);
		}
	}

	function holdOtherCalls(activeCall: any) {
		if (callList.value.length > 1) {
			callList.value.forEach((otherCall) => {
				if (otherCall !== activeCall) setHold(otherCall);
			});
		}
	}

	function toggleVideo() {
		const value = !isVideo.value;
		localStorage.setItem('isVideo', JSON.stringify(value));
		setVideo(value);
	}

	function restoreVideoParam() {
		const value = localStorage.getItem('isVideo');
		if (value) setVideo(JSON.parse(value));
	}

	function toggleVideoMute({ callId }: { callId?: string } = {}) {
		const targetCall = callId ? getCallById(callId) : callOnWorkspace.value;
		targetCall.muteVideo(!targetCall.mutedVideo);
	}

	function setWorkspace(task: any) {
		workspaceStore.setWorkspaceState({ type: WorkspaceStates.CALL, task });
	}

	function resetWorkspace() {
		workspaceStore.resetWorkspaceState();
	}

	const subscriptionStore: CallSubscriptionStore = {
		callList,
		callOnWorkspace,
		isOfflineCall,
		setCallList,
		addCall,
		removeCall,
		updateCallInfo,
		holdOtherCalls,
		setWorkspace,
		resetWorkspace,
		answer,
		hangup,
	};
	const { subscribe } = useCallSubscription(subscriptionStore);

	return {
		// state
		callList,
		isVideo,
		callInfo,

		// getters
		callOnWorkspace,
		isNewCall,
		currentCallDigits,
		isAnyRinging,
		isOfflineCall,
		isVideoCall,
		isVideoCallOnWorkspace,
		getCallById,
		normalizePhoneNumber,

		// state mutations
		setCallList,
		addCall,
		removeCall,
		updateCallInfo,
		clearCallInfo,

		// actions
		call,
		answer,
		blindTransfer,
		bridge,
		toggleMute,
		toggleHold,
		setHold,
		sendDtmf,
		hangup,
		openActiveCall,
		openNewCall,
		closeNewCall,
		addDigit,
		setNewNumber,
		holdOtherCalls,
		toggleVideo,
		restoreVideoParam,
		toggleVideoMute,
		setWorkspace,
		resetWorkspace,
		subscribe,

		newNumbers,
		getNewNumber,
	};
});

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useCallStore, import.meta.hot));
}
