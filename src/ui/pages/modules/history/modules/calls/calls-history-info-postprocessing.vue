<template>
	<ul v-if="sections.length" class="calls-history-info-postprocessing">
		<li
			v-for="(section, index) of sections"
			:key="index"
		>
			<div
				v-if="section.agent"
				class="calls-history-info-postprocessing__agent typo-body-2-bold"
			>
				<wt-icon icon="agent" />
				{{ section.agent.name }}
			</div>

			<template
				v-for="(field, index) of section.fields"
				:key="field.key"
			>
				<wt-divider v-if="index" />
				<p class="calls-history-info-postprocessing__field typo-body-2">
					<span class="typo-body-2-bold">{{ field.key }}:</span>
					{{ field.value }}
				</p>
			</template>
		</li>
	</ul>

	<wt-empty
		v-else
		:image="emptyImage"
		:text="t('ui.reusable.nothingToShowHere')"
	/>
</template>

<script setup lang="ts">
import type { EngineLookup } from '@webitel/api-services/gen/models';
import emptyTableDark from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-dark.svg';
import emptyTableLight from '@webitel/ui-sdk/src/modules/TableComponentModule/_internals/assets/empty-table-light.svg';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemedImage } from '../../../../../../app/composables/useThemedImage';
import type { CallInfoForm, CallInfoFormField } from './types/CallInfo.types';

interface PostprocessingSection {
	agent?: EngineLookup;
	fields: CallInfoFormField[];
}

const props = defineProps<{
	forms?: CallInfoForm[];
	agentDescription?: string;
}>();

const { t } = useI18n();

const emptyImage = useThemedImage({
	light: emptyTableLight,
	dark: emptyTableDark,
});

const sections = computed<PostprocessingSection[]>(() => {
	const forms = props.forms ?? [];
	if (!props.agentDescription) return forms;

	return [
		{
			fields: [
				{
					key: t('ui.pages.history.calls.callInfo.agentDescription'),
					value: props.agentDescription,
				},
			],
		},
		...forms,
	];
});
</script>

<style scoped>
.calls-history-info-postprocessing__agent {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
	--icon-color: var(--wt-ws-chat-queue-pannel-colors-chat-end-reason-indicator-color);
}

.calls-history-info-postprocessing__field {
	padding: var(--spacing-xs) 0;
	word-break: break-word;
}

.wt-empty {
	height: 100%;
}
</style>
