<template>
	<div class="contact-card">
		<wt-loader v-if="isLoading" />
		<div
			v-else-if="contact"
			class="contact-card__content"
		>
			<contact-card-header :contact="contact" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useContact } from './composables/useContact';
import ContactCardHeader from './contact-card-header.vue';

const props = defineProps<{
	contactId: string;
}>();

const { contact, isLoading } = useContact(toRef(props, 'contactId'));
</script>

<style scoped>
.contact-card {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.contact-card .wt-loader {
	margin: auto;
}
</style>
