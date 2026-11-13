<template>
	<wt-rich-text-editor
		:height="height"
		:label="label"
		:label-props="labelProps"
		:model-value="text"
		:output="output"
		:plugins="editorPlugins"
		:toolbar="editorToolbar"
		@update:model-value="emit('update:modelValue', $event)"
	/>
</template>

<script setup lang="ts">
import {
	RichTextEditorToolbarItem as Item,
	RichTextEditorPlugin,
} from '@webitel/ui-sdk/enums';
import { computed } from 'vue';

// The shared ui-sdk editor, which loads TinyMCE only when a form renders one.
const props = defineProps<{
	modelValue?: unknown;
	label?: string;
	labelProps?: Record<string, unknown>;
	/** `html` (default) or `text` */
	output?: 'html' | 'text';
	height?: number | string;
}>();

const emit = defineEmits<{
	'update:modelValue': [
		value: string,
	];
}>();

// the renderer passes every schema key; only the ones above apply
defineOptions({
	inheritAttrs: false,
});

// A seeded value can arrive as a number (JSON-parsed initialValue), which the
// editor cannot take (WTEL-4477); an unseeded one arrives as ''.
const text = computed(() =>
	props.modelValue === undefined || props.modelValue === null
		? ''
		: String(props.modelValue),
);

// [Claude] The processing form's editor setup; `text` output keeps ui-sdk's plain-text defaults
const HTML_PLUGINS: string[] = [
	RichTextEditorPlugin.ADV_LIST,
	RichTextEditorPlugin.EMOTICONS,
	RichTextEditorPlugin.FULLSCREEN,
	RichTextEditorPlugin.IMAGE,
	RichTextEditorPlugin.LINK,
	RichTextEditorPlugin.LISTS,
	RichTextEditorPlugin.TABLE,
];

const HTML_TOOLBAR = [
	[
		Item.UNDO,
		Item.REDO,
	],
	[
		Item.BOLD,
		Item.ITALIC,
		Item.UNDERLINE,
		Item.STRIKETHROUGH,
	],
	[
		Item.FULLSCREEN,
	],
	[
		Item.FONT_FAMILY,
		Item.FONT_SIZE,
	],
	[
		Item.ALIGN_LEFT,
		Item.ALIGN_CENTER,
		Item.ALIGN_RIGHT,
		Item.ALIGN_JUSTIFY,
	],
	[
		Item.NUM_LIST,
		Item.BUL_LIST,
	],
	[
		Item.FORE_COLOR,
		Item.BACK_COLOR,
		Item.REMOVE_FORMAT,
	],
	[
		Item.EMOTICONS,
		Item.IMAGE,
		Item.LINK,
		Item.TABLE,
	],
];

// [Claude] `output` is unset unless the schema sets it, and ui-sdk then edits html
const isHtml = computed(() => (props.output ?? 'html') === 'html');
const editorPlugins = computed(() => (isHtml.value ? HTML_PLUGINS : undefined));
const editorToolbar = computed(() => (isHtml.value ? HTML_TOOLBAR : undefined));
</script>
