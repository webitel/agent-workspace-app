<template>
	<section class="contact-card-communication">
		<div class="typo-body-1-bold">
			{{ t('ui.sidebar.contact.communicationOptions') }}
		</div>

		<div class="contact-card-communication__tabs">
			<wt-tabs
				class="contact-card-communication__tabs-list"
				:current="currentTab"
				:tabs="tabs"
				:size="ComponentSize.SM"
				@change="selectTab"
			/>
			<wt-button
				class="contact-card-communication__add"
				:class="{
					'contact-card-communication__add--hidden': isAddButtonHidden,
				}"
				:inert="isAddButtonHidden || undefined"
				icon="plus"
				:size="ComponentSize.SM"
				:color="ButtonColor.SECONDARY"
				:variant="ButtonVariant.TEXT"
				:aria-label="t('reusable.add')"
				width-by-content
				@click="isAdding = true"
			/>
		</div>

		<contact-card-communication-add-form
			v-if="addableTab && isAdding"
			:key="`${contact.id}-${addableTab}`"
			:tab="addableTab"
			:contact-id="contact.id ?? ''"
			:is-first="!communication[addableTab].length"
			@saved="onSaved"
			@cancel="isAdding = false"
		/>

		<ul class="contact-card-communication__list">
			<contact-card-communication-item
				v-for="item of communication[currentTab.value]"
				:key="item.id"
				:item="item"
			/>
		</ul>
	</section>
</template>

<script setup lang="ts">
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { WtButton, WtTabs } from '@webitel/ui-sdk/components';
import {
	ButtonColor,
	ButtonVariant,
	ComponentSize,
} from '@webitel/ui-sdk/enums';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ContactCardCommunicationAddForm from './contact-card-communication-add-form.vue';
import ContactCardCommunicationItem from './contact-card-communication-item.vue';
import { isAddableCommunicationTab } from './scripts/contactCommunicationAdd';
import {
	type ContactCommunication,
	toContactCommunication,
} from './scripts/toContactCommunication';

interface CommunicationTabItem {
	value: keyof ContactCommunication;
	text: string;
}

const props = defineProps<{
	contact: WebitelContactsContact;
}>();

const emit = defineEmits<{
	/** a record was added, so the contact is stale */
	changed: [];
}>();

const { t } = useI18n();

const communication = computed(() => toContactCommunication(props.contact));

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

const currentTab = ref<CommunicationTabItem>(tabs.value[0]);

/**
 * @author Polina Sukhorukova
 * Phones and Emails take new records, Messaging does not (AC_07.07.08–09)
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const addableTab = computed(() =>
	isAddableCommunicationTab(currentTab.value.value)
		? currentTab.value.value
		: null,
);

/**
 * @author Polina Sukhorukova
 * On Messaging the add button is hidden, not removed: it is taller than the
 * tabs, so the row would jump on every switch to and from that tab. It is
 * hidden with opacity, as wt-icon transitions every property and an inherited
 * visibility would keep the icon on screen while it hides; `inert` takes it out
 * of clicks, focus and the accessibility tree
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const isAddButtonHidden = computed(() => !addableTab.value);

/**
 * @author Polina Sukhorukova
 * The add form belongs to one tab of one contact: switching either drops it
 * with whatever was typed, a reload of the same contact keeps it
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
const isAdding = ref(false);

function selectTab(tab: CommunicationTabItem) {
	currentTab.value = tab;
	isAdding.value = false;
}

watch(
	() => props.contact.id,
	() => {
		isAdding.value = false;
	},
);

function onSaved() {
	isAdding.value = false;
	emit('changed');
}
</script>

<style scoped>
.contact-card-communication {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}

.contact-card-communication__tabs {
	display: flex;
	align-items: center;
	gap: var(--spacing-xs);
}

.contact-card-communication__tabs-list {
	flex: 1;
	min-width: 0;
}

.contact-card-communication__add {
	flex-shrink: 0;
}

.contact-card-communication__add--hidden {
	opacity: 0;
}

.contact-card-communication__list {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-xs);
}
</style>
