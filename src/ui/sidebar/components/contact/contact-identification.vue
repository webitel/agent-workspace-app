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
		<!-- several matches: the X of Y switcher comes with US_07.04 -->
		<div
			v-else
			class="contact-identification__multiple"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ContactCard from './contact-card.vue';
import ContactPanelEmpty from './contact-panel-empty.vue';
import { ContactIdentificationMode } from './enums/ContactIdentificationMode.enum';

const props = defineProps<{
	contactIds: string[];
	isLoading?: boolean;
}>();

const mode = computed<ContactIdentificationMode>(() => {
	if (props.isLoading) return ContactIdentificationMode.Loading;
	if (!props.contactIds.length) return ContactIdentificationMode.NotFound;
	if (props.contactIds.length === 1) return ContactIdentificationMode.Single;
	return ContactIdentificationMode.Multiple;
});
</script>

<style scoped>
.contact-identification {
	display: flex;
	flex-direction: column;
}

.contact-identification .wt-loader {
	margin: auto;
}
</style>
