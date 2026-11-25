<template>
	<div class="contact-card-by-id">
		<wt-loader v-if="isLoading" />
		<contact-card
			v-else-if="contact"
			:contact="contact"
		/>
	</div>
</template>

<script setup lang="ts">
import { toRef } from 'vue';
import { useContact } from './composables/useContact';
import ContactCard from './contact-card.vue';

/**
 * The contact card of a contact known only by its id (a table row's, a
 * selection's), loaded with its every field
 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
 */
const props = defineProps<{
	contactId: string;
}>();

const { contact, isLoading } = useContact(toRef(props, 'contactId'));
</script>

<style scoped>
.contact-card-by-id {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.contact-card-by-id .wt-loader {
	margin: auto;
}
</style>
