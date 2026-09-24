<template>
	<article :class="['processing-form-text', `processing-form-text--${colorName}`]">
		<div class="processing-form-text__badge">
			<wt-icon
				color="on-dark"
				icon="attention"
				size="sm"
			/>
		</div>

		<header class="processing-form-text__title">
			{{ label }}
			<wt-hint v-if="hint">{{ hint }}</wt-hint>

			<div class="processing-form-text__actions">
				<wt-copy-action
					v-if="enableCopying"
					v-show="isExpanded"
					:value="valueToCopy"
				/>
				<wt-icon-btn
					v-if="collapsible"
					:icon="collapsed ? 'arrow-right' : 'arrow-down'"
					@click="collapsed = !collapsed"
				/>
			</div>
		</header>

		<!-- sanitized after rendering, see `content` -->
		<div
			v-show="isExpanded"
			class="processing-form-text__content"
			v-html="content"
		/>
	</article>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import { computed, ref } from 'vue';

// Display-only: the text comes in `initialValue`, and the field is left out of
// the submitted values (formattingFormBeforeSend drops `form-text`).
const props = withDefaults(
	defineProps<{
		initialValue?: string | unknown[];
		label?: string;
		hint?: string;
		color?: string;
		collapsible?: boolean;
		enableCopying?: boolean;
	}>(),
	{
		initialValue: '',
		label: '',
		hint: '',
		color: 'info',
		collapsible: false,
		enableCopying: false,
	},
);

// the renderer passes model-value / label-props to every field; none apply here
defineOptions({
	inheritAttrs: false,
});

const md = new MarkdownIt({
	html: true,
	linkify: true,
});

// Links leave the workspace in a new tab, without handing it a window.opener.
const renderLinkOpen =
	md.renderer.rules.link_open ??
	((tokens, index, options, _env, self) =>
		self.renderToken(tokens, index, options));
md.renderer.rules.link_open = (tokens, index, options, env, self) => {
	tokens[index].attrSet('target', '_blank');
	tokens[index].attrSet('rel', 'noopener noreferrer');
	return renderLinkOpen(tokens, index, options, env, self);
};

// Backend color names, including the deprecated aliases cc-workspaces accepts.
const colorAliases: Record<string, string> = {
	default: 'info',
	accent: 'primary',
	danger: 'error',
};
const colorName = computed(() => colorAliases[props.color] ?? props.color);

const collapsed = ref(true);
const isExpanded = computed(() => !props.collapsible || !collapsed.value);

const text = computed(() => String(props.initialValue ?? ''));

// Sanitize the rendered HTML, not the source: `html: true` lets raw markup
// through the markdown pass, so the output is what has to be cleaned.
const content = computed(() =>
	DOMPurify.sanitize(md.render(text.value), {
		ADD_ATTR: [
			'target',
		],
	}),
);

const valueToCopy = computed(() => text.value.replace(/<br\s*\/?>/gi, '\n'));
</script>

<style scoped>
.processing-form-text {
	--processing-form-text-color: var(--info-color);

	position: relative;
	padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-sm)
		var(--spacing-sm);
	border: 1px dashed var(--processing-form-text-color);
	border-radius: var(--border-radius);
}

.processing-form-text--secondary {
	--processing-form-text-color: var(--secondary-color);
}

.processing-form-text--primary {
	--processing-form-text-color: var(--primary-color);
}

.processing-form-text--success {
	--processing-form-text-color: var(--success-color);
}

.processing-form-text--error {
	--processing-form-text-color: var(--error-color);
}

.processing-form-text__badge {
	position: absolute;
	top: 0;
	right: var(--spacing-xs);
	padding: var(--spacing-3xs);
	line-height: 0;
	border-radius: 0 0 var(--border-radius) var(--border-radius);
	background: var(--processing-form-text-color);
}

.processing-form-text__title {
	display: flex;
	align-items: center;
	gap: var(--spacing-2xs);
	margin-right: var(--spacing-sm);
}

.processing-form-text__actions {
	display: flex;
	gap: var(--spacing-xs);
	margin-left: auto;
}

.processing-form-text__content {
	min-width: 0;
	white-space: normal;
	overflow-wrap: anywhere;
	word-break: break-word;
}
</style>
