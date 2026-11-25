<template>
	<div class="contact-card">
		<contact-card-header :contact="contact" />

		<wt-divider />

		<contact-card-info :contact="contact" />

		<wt-divider />

		<contact-card-communication :contact="contact" />
	</div>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import ContactCardCommunication from './contact-card-communication.vue';
import ContactCardHeader from './contact-card-header.vue';
import ContactCardInfo from './contact-card-info.vue';

/**
 * Shows a contact it is given and loads nothing: found contacts come with every
 * field it shows, a contact known only by its id is loaded by contact-card-by-id
 * [WS-186](https://webitel.atlassian.net/browse/WS-186)
 */
defineProps<{
	contact: WebitelContactsContact;
}>();
</script>

<style scoped>
.contact-card {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
