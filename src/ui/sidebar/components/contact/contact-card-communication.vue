<template>
	<section class="contact-card-communication">
		<div class="typo-body-1-bold">
			{{ t('ui.sidebar.contact.communicationOptions') }}
		</div>

		<wt-tabs
			:current="{ value: activeTab }"
			:tabs="tabs"
			:size="ComponentSize.SM"
			@change="handleTabChange"
		/>

		<ul class="contact-card-communication__list">
			<contact-card-communication-item
				v-for="item of communication[activeTab]"
				:key="item.id"
				:item="item"
			/>
		</ul>
	</section>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { WtTabs } from '@webitel/ui-sdk/components';
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ContactCardCommunicationItem from './contact-card-communication-item.vue';
import {
	type ContactCommunication,
	toContactCommunication,
} from './scripts/toContactCommunication';

type CommunicationTab = keyof ContactCommunication;

interface CommunicationTabItem {
	value: CommunicationTab;
	text: string;
}

const props = defineProps<{
	contact: WebitelContactsContact;
}>();

const { t } = useI18n();

const communication = computed(() => toContactCommunication(props.contact));

const activeTab = ref<CommunicationTab>('phones');

const tabs = computed<CommunicationTabItem[]>(() => [
	{
		value: 'phones',
		text: t('vocabulary.phones', 2),
	},
	{
		value: 'messaging',
		text: t('vocabulary.messaging'),
	},
	{
		value: 'emails',
		text: t('vocabulary.emails', 2),
	},
]);

function handleTabChange(tab: CommunicationTabItem) {
	activeTab.value = tab.value;
}
</script>

<style scoped>
.contact-card-communication {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-card-communication__list {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
