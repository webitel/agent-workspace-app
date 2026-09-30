<template>
	<ul class="calls-history-info-postprocessing">
		<li
			v-for="(section, index) of sections"
			:key="index"
		>
			<div
				v-if="section.agent"
				class="calls-history-info-postprocessing__agent typo-subtitle-1"
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
</template>

<script setup lang="ts">
import type { EngineLookup } from '@webitel/api-services/gen/models';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CallInfoForm } from './types/CallInfo.types';

interface PostprocessingSection {
	agent?: EngineLookup;
	fields: {
		key: string;
		value: string;
	}[];
}

const FILE_FIELDS = [
	'filesIncome',
	'filesOutcome',
];

const props = defineProps<{
	forms?: CallInfoForm[];
	agentDescription?: string;
}>();

const { t } = useI18n();

const formatFieldValue = (key: string, value: string) => {
	if (!FILE_FIELDS.includes(key)) return value;
	try {
		const files: {
			name: string;
		}[] = JSON.parse(value);
		return files.map(({ name }) => name).join(', ');
	} catch {
		return value;
	}
};

const sections = computed<PostprocessingSection[]>(() => {
	const formSections = (props.forms ?? [])
		.filter(({ form_fields }) => form_fields && Object.keys(form_fields).length)
		.map(({ agent, form_fields }) => ({
			agent,
			fields: Object.entries(form_fields ?? {}).map(([key, value]) => ({
				key,
				value: formatFieldValue(key, value),
			})),
		}));

	if (!props.agentDescription) return formSections;

	return [
		{
			fields: [
				{
					key: t('ui.pages.history.calls.callInfo.agentDescription'),
					value: props.agentDescription,
				},
			],
		},
		...formSections,
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
</style>
