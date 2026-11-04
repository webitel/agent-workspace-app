import { FormatDateMode, IconColor } from '@webitel/ui-sdk/enums';
import { convertDuration } from '@webitel/ui-sdk/scripts';
import { formatDate } from '@webitel/ui-sdk/utils';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useI18n } from 'vue-i18n';
import { CallDirection } from 'webitel-sdk';

import { useElapsedSec } from '../../../ui/composables/useElapsedSec';
import { CallPanelInfoField } from '../enums/CallPanelInfoField.enum';
import type {
	CallPanelInfo,
	CallPanelInfoFieldDef,
	CallPanelInfoRow,
	CallPanelInfoView,
} from '../types/CallPanelInfo.types';

export function useCallPanelInfo(info: MaybeRefOrGetter<CallPanelInfo>) {
	const { t } = useI18n();

	// A direction without an entry shows no block: the outbound one comes with US_16.03.
	const viewByDirection: Partial<Record<CallDirection, CallPanelInfoView>> = {
		[CallDirection.Inbound]: {
			icon: 'ws-inbound-call',
			iconColor: IconColor.SUCCESS,
			title: () => t('ui.call.direction.inbound'),
			fields: [
				CallPanelInfoField.From,
				CallPanelInfoField.To,
				CallPanelInfoField.Queue,
			],
		},
	};

	const fieldDefs: Record<CallPanelInfoField, CallPanelInfoFieldDef> = {
		[CallPanelInfoField.From]: {
			label: () => t('reusable.from'),
			value: ({ from }) => from,
		},
		[CallPanelInfoField.To]: {
			label: () => t('reusable.to'),
			value: ({ to }) => to,
		},
		[CallPanelInfoField.Queue]: {
			label: () => t('objects.queue.queue', 1),
			value: ({ queueName }) => queueName,
		},
	};

	const view = computed(() => {
		const { direction } = toValue(info);
		return direction ? viewByDirection[direction] : undefined;
	});

	const startedAt = computed(() => {
		const { createdAt } = toValue(info);
		if (!createdAt) return undefined;
		return `${t('ui.reusable.startedAt')}: ${formatDate(createdAt, FormatDateMode.TIME_SEC)}`;
	});

	// A field the call does not have is left out rather than shown empty.
	const rows = computed<CallPanelInfoRow[]>(() =>
		(view.value?.fields ?? []).flatMap((field) => {
			const { label, value } = fieldDefs[field];
			const fieldValue = value(toValue(info));
			return fieldValue
				? [
						{
							field,
							label: label(),
							value: fieldValue,
						},
					]
				: [];
		}),
	);

	// Same format as the call dock's timer: hours always shown.
	const elapsedSec = useElapsedSec(() => toValue(info).answeredAt);
	const duration = computed(() => convertDuration(elapsedSec.value));

	return {
		view,
		rows,
		startedAt,
		duration,
	};
}
