<template>
	<!-- a read-only field with nothing to show is left out entirely -->
	<article
		v-if="!readonly || files.length"
		:class="{
			'processing-form-file--dragging': isDragging,
		}"
		class="processing-form-file"
		@dragenter.prevent="isDragging = !readonly"
		@dragover.prevent
		@dragleave.self.prevent="isDragging = false"
		@drop.prevent="handleDrop"
	>
		<header class="processing-form-file__title">
			<wt-icon
				class="processing-form-file__icon"
				color="on-dark"
				icon="log"
			/>
			{{ label }}
			<span v-if="files.length">({{ files.length }} {{ files.length === 1 ? 'file' : 'files' }})</span>
			<wt-hint v-if="hint">{{ hint }}</wt-hint>

			<div class="processing-form-file__actions">
				<wt-icon-btn
					v-if="readonly"
					:disabled="isDownloading"
					icon="download"
					@click="downloadAll"
				/>
				<template v-else>
					<wt-icon-btn
						icon="attach"
						@click="fileInput?.click()"
					/>
					<input
						ref="fileInput"
						class="processing-form-file__input"
						multiple
						type="file"
						@change="handleFileInput"
					>
				</template>
				<wt-icon-btn
					v-if="collapsible"
					:icon="collapsed ? 'arrow-right' : 'arrow-down'"
					@click="collapsed = !collapsed"
				/>
			</div>
		</header>

		<section
			v-show="!collapsible || !collapsed"
			class="processing-form-file__files"
		>
			<processing-form-file-line
				v-for="file in files"
				:key="file.id"
				:file="file"
				:href="downloadUrl(file)"
				:readonly="readonly"
				@delete="fileToDelete = file"
			/>
			<processing-form-file-line
				v-for="upload in uploads"
				:key="upload.key"
				:file="upload.file"
				:upload="upload"
				@dismiss="removeUpload(upload)"
			/>
			<p
				v-if="!files.length && !uploads.length"
				class="processing-form-file__empty"
			>
				No files yet. Attach or drop them here.
			</p>
		</section>

		<wt-confirm-dialog
			v-if="fileToDelete"
			:callback="deleteFile"
			:delete-message="`Remove ${fileToDelete.name} from the form?`"
			title="Remove file"
			@close="fileToDelete = null"
		/>
	</article>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import { useWebSocketClient } from '../../../../app/api/socket/composables/useWebSocketClient';
import type {
	FormFileUpload,
	FormStoredFile,
} from '../../types/ProcessingForm.types';
import ProcessingFormFileLine from './processing-form-file-line.vue';

// How long a finished (or failed) upload stays on screen with its badge
// before it turns into a stored file line (or waits to be dismissed).
const SETTLE_MS = 1600;

const props = withDefaults(
	defineProps<{
		modelValue?: unknown;
		/** the task attempt files are uploaded against */
		attemptId?: number | string;
		/** set by case forms: upload against the case instead of the attempt */
		channel?: string;
		entityId?: string;
		label?: string;
		hint?: string;
		readonly?: boolean;
		collapsible?: boolean;
	}>(),
	{
		modelValue: () => [],
		attemptId: undefined,
		channel: '',
		entityId: '',
		label: '',
		hint: '',
		readonly: false,
		collapsible: false,
	},
);

const emit = defineEmits<{
	'update:modelValue': [
		value: FormStoredFile[],
	];
}>();

// the renderer passes model-value / label-props to every field
defineOptions({
	inheritAttrs: false,
});

const { getClient } = useWebSocketClient();

// Stored files are the value; an unseeded field still arrives as ''.
const files = computed<FormStoredFile[]>(() =>
	Array.isArray(props.modelValue) ? props.modelValue : [],
);

const uploads = ref<FormFileUpload[]>([]);
const fileInput = ref<HTMLInputElement>();
const collapsed = ref(true);
const isDragging = ref(false);
const isDownloading = ref(false);
const fileToDelete = ref<FormStoredFile | null>(null);

let uploadKey = 0;

/*
 * The value only updates once the parent re-renders, so two uploads settling
 * in the same tick would each append to the same stale list and one file would
 * be lost. Changes build on what was last emitted until the prop catches up.
 */
let emittedFiles: FormStoredFile[] | null = null;
watch(files, () => {
	emittedFiles = null;
});

function commitFiles(next: FormStoredFile[]) {
	emittedFiles = next;
	emit('update:modelValue', next);
}

const currentFiles = () => emittedFiles ?? files.value;

function downloadUrl(file: FormStoredFile) {
	return getClient().fileUrlDownload(Number(file.id), file.mime ?? '');
}

function removeUpload(upload: FormFileUpload) {
	uploads.value = uploads.value.filter((item) => item !== upload);
}

async function uploadFile(file: File) {
	collapsed.value = false;
	const upload = reactive<FormFileUpload>({
		key: `upload-${uploadKey++}`,
		file: {
			id: '',
			name: file.name,
			mime: file.type,
			size: file.size,
		},
		loaded: 0,
		total: file.size,
		done: false,
		failed: false,
	});
	uploads.value.push(upload);

	try {
		const onProgress = ({ loaded, total }: ProgressEvent) => {
			upload.loaded = loaded;
			upload.total = total;
		};
		const client = getClient();
		const stored = props.channel
			? await client.storeFile(
					props.entityId,
					[
						file,
					],
					onProgress,
					props.channel,
				)
			: await client.storeFile(
					String(props.attemptId),
					[
						file,
					],
					onProgress,
				);
		upload.done = true;
		setTimeout(() => {
			removeUpload(upload);
			commitFiles([
				...currentFiles(),
				...(stored as unknown as FormStoredFile[]),
			]);
		}, SETTLE_MS);
	} catch {
		upload.failed = true;
	}
}

function uploadAll(fileList: FileList | null | undefined) {
	for (const file of Array.from(fileList ?? [])) uploadFile(file);
}

function handleFileInput(event: Event) {
	const input = event.target as HTMLInputElement;
	uploadAll(input.files);
	input.value = ''; // let the same file be picked again
}

function handleDrop(event: DragEvent) {
	isDragging.value = false;
	if (props.readonly) return;
	uploadAll(event.dataTransfer?.files);
}

function deleteFile() {
	const deleted = fileToDelete.value;
	commitFiles(currentFiles().filter((file) => file.id !== deleted?.id));
}

// Zips every stored file for a read-only field. jszip only loads on demand.
async function downloadAll() {
	isDownloading.value = true;
	try {
		const { default: JSZip } = await import('jszip');
		const zip = new JSZip();
		for (const file of files.value) {
			const response = await fetch(downloadUrl(file));
			zip.file(file.name, await response.arrayBuffer());
		}
		const archive = await zip.generateAsync({
			type: 'blob',
		});
		const link = document.createElement('a');
		link.href = URL.createObjectURL(archive);
		link.download = `${props.label || 'files'}.zip`;
		link.click();
		URL.revokeObjectURL(link.href);
	} finally {
		isDownloading.value = false;
	}
}
</script>

<style scoped>
.processing-form-file {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
	padding-bottom: var(--spacing-sm);
	border: 1px dashed var(--secondary-color);
	border-radius: var(--border-radius);
}

.processing-form-file--dragging {
	border-color: var(--primary-color);
	background: var(--primary-light-color, transparent);
}

.processing-form-file__title {
	display: flex;
	align-items: center;
	gap: var(--spacing-2xs);
	padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs)
		var(--spacing-xs);
	border-radius: var(--border-radius);
}

.processing-form-file__icon {
	margin-right: var(--spacing-xs);
	padding: var(--spacing-3xs);
	line-height: 0;
	border-radius: var(--border-radius);
	background: var(--job-color, var(--secondary-color));
}

.processing-form-file__actions {
	display: flex;
	gap: var(--spacing-xs);
	margin-left: auto;
	line-height: 0;
}

.processing-form-file__input {
	display: none;
}

.processing-form-file__empty {
	padding: var(--spacing-sm);
	text-align: center;
}
</style>
