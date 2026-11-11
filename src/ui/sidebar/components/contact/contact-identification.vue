<template>
	<div class="contact-identification">
		<wt-loader v-if="mode === ContactIdentificationMode.Loading" />
		<!-- the "not found" texts and the CREATE / search actions come with US_07.03 -->
		<contact-panel-empty
			v-else-if="mode === ContactIdentificationMode.NotFound"
			title=""
			text=""
		/>
		<contact-card
			v-else-if="mode === ContactIdentificationMode.Single"
			:contact-id="contactIds[0]"
		/>
		<div
			v-else
			class="contact-identification__multiple"
		>
			<contact-switcher
				:position="shownIndex + 1"
				:count="contactIds.length"
				@prev="showPrev"
				@next="showNext"
			/>
			<contact-card :contact-id="shownContactId" />
		</div>
		<!-- the parent's own actions (e.g. CREATE) share one row with SELECT -->
		<div
			v-if="mode !== ContactIdentificationMode.Loading"
			class="contact-identification__actions"
		>
			<slot name="actions" />
			<wt-button
				v-if="isSelectShown"
				:color="ButtonColor.SUCCESS"
				@click="emit('select', shownContactId)"
			>
				{{ t('ui.reusable.select') }}
			</wt-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { WtButton } from '@webitel/ui-sdk/components';
import { ButtonColor } from '@webitel/ui-sdk/enums';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ContactCard from './contact-card.vue';
import ContactPanelEmpty from './contact-panel-empty.vue';
import ContactSwitcher from './contact-switcher.vue';
import { ContactIdentificationMode } from './enums/ContactIdentificationMode.enum';

const props = defineProps<{
	contactIds: string[];
	isLoading?: boolean;
	// whether the shown contact can be chosen; the block itself links nothing
	canSelect?: boolean;
}>();

const emit = defineEmits<{
	select: [
		contactId: string,
	];
}>();

const { t } = useI18n();

const mode = computed<ContactIdentificationMode>(() => {
	if (props.isLoading) return ContactIdentificationMode.Loading;
	if (!props.contactIds.length) return ContactIdentificationMode.NotFound;
	if (props.contactIds.length === 1) return ContactIdentificationMode.Single;
	return ContactIdentificationMode.Multiple;
});

const isSelectShown = computed(
	() => props.canSelect && mode.value === ContactIdentificationMode.Multiple,
);

const shownIndex = ref(0);

const shownContactId = computed(() => props.contactIds[shownIndex.value]);

// a new result starts from its first contact
watch(
	() => props.contactIds,
	() => {
		shownIndex.value = 0;
	},
);

function showPrev() {
	shownIndex.value -= 1;
}

function showNext() {
	shownIndex.value += 1;
}
</script>

<style scoped>
.contact-identification {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-identification .wt-loader {
	margin: auto;
}

.contact-identification__multiple {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-identification__actions {
	display: flex;
	justify-content: center;
	gap: var(--spacing-xs);
}
</style>
