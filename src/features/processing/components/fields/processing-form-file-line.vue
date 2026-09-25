<template>
	<div
		:class="{
			'processing-form-file-line--readonly': readonly,
		}"
		class="processing-form-file-line"
	>
		<wt-icon
			:icon="typeIcon"
			class="processing-form-file-line__type-icon"
		/>
		<a
			v-if="href"
			:href="href"
			class="processing-form-file-line__name"
			rel="noopener noreferrer"
			target="_blank"
		>{{ file.name }}</a>
		<span
			v-else
			class="processing-form-file-line__name"
		>{{ file.name }}</span>
		<span class="processing-form-file-line__size">{{ readableSize }}</span>

		<template v-if="!readonly">
			<div class="processing-form-file-line__status">
				<wt-load-bar
					v-if="status === FileLineStatus.Uploading"
					:max="upload?.total || 1"
					:value="upload?.loaded ?? 0"
				/>
				<span
					v-else-if="status === FileLineStatus.Failed"
					class="processing-form-file-line__error"
				>Upload failed</span>
			</div>

			<div class="processing-form-file-line__action">
				<wt-icon-btn
					v-if="status === FileLineStatus.Stored"
					icon="bucket"
					@click="emit('delete')"
				/>
				<wt-icon-btn
					v-else-if="status === FileLineStatus.Failed"
					icon="close"
					@click="emit('dismiss')"
				/>
				<wt-icon
					v-else-if="status === FileLineStatus.Uploaded"
					icon="done"
				/>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { prettifyFileSize } from '@webitel/ui-sdk/scripts';
import { computed } from 'vue';

import type {
	FormFileUpload,
	FormStoredFile,
} from '../../types/ProcessingForm.types';

const props = withDefaults(
	defineProps<{
		file: FormStoredFile;
		/** set while the file is still being uploaded */
		upload?: FormFileUpload;
		/** download link, once the file is stored */
		href?: string;
		readonly?: boolean;
	}>(),
	{
		upload: undefined,
		href: '',
		readonly: false,
	},
);

const emit = defineEmits<{
	delete: [];
	dismiss: [];
}>();

const FileLineStatus = {
	Stored: 'stored',
	Uploading: 'uploading',
	Uploaded: 'uploaded',
	Failed: 'failed',
} as const;

const status = computed(() => {
	if (!props.upload) return FileLineStatus.Stored;
	if (props.upload.failed) return FileLineStatus.Failed;
	if (props.upload.done) return FileLineStatus.Uploaded;
	return FileLineStatus.Uploading;
});

const readableSize = computed(() => prettifyFileSize(props.file.size ?? 0));

const typeIcon = computed(() => {
	const mime = props.file.mime ?? '';
	if (mime.includes('image')) return 'preview-tag-image';
	if (mime.includes('application')) return 'preview-tag-application';
	if (mime.includes('video')) return 'preview-tag-video';
	if (mime.includes('audio')) return 'preview-tag-audio';
	return 'log';
});
</script>

<style scoped>
.processing-form-file-line {
	display: grid;
	grid-template-columns: 24px 1fr auto minmax(80px, 100px) 24px;
	align-items: center;
	gap: var(--spacing-xs);
	padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs)
		var(--spacing-xs);
}

.processing-form-file-line--readonly {
	grid-template-columns: 24px 1fr auto;
}

.processing-form-file-line__name {
	word-break: break-all;
	color: var(--info-color);
}

.processing-form-file-line__error {
	color: var(--error-color);
}

.processing-form-file-line__action {
	line-height: 0;
}
</style>
