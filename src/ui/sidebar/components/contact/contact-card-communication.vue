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
			:tab="addableTab"
			:is-saving="savingKey === formKey"
			@submit="save(addableTab, $event)"
			@cancel="isAdding = false"
		/>

		<ul class="contact-card-communication__list">
			<contact-card-communication-item
				v-for="item of communication[currentTab.value]"
				:key="item.id"
				:item="item"
			>
				<template
					v-if="currentTab.value === 'phones'"
					#actions
				>
					<phone-call-button
						:number="item.value"
						:disabled="callingNumber === item.value"
						@click="call(item.value)"
					/>
				</template>
			</contact-card-communication-item>
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

import { useOutboundCall } from '../../../../features/calls/composables/useOutboundCall';
import PhoneCallButton from '../../../components/phone-call-button/phone-call-button.vue';
import ContactCardCommunicationAddForm from './contact-card-communication-add-form.vue';
import ContactCardCommunicationItem from './contact-card-communication-item.vue';
import {
	type AddableCommunicationTab,
	addCommunication,
	isAddableCommunicationTab,
	type NewCommunication,
} from './scripts/contactCommunicationAdd';
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

const { callingNumber, call } = useOutboundCall();

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
 * The add form belongs to one tab of one contact: switching either closes it,
 * and closing unmounts it with whatever was typed, so no `key` is needed to
 * reset it; a reload of the same contact keeps it
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

const toFormKey = (contactId: string | undefined, tab: string) =>
	`${contactId}-${tab}`;

/** the contact and tab the form is open for, to match it with a save */
const formKey = computed(() =>
	toFormKey(props.contact.id, addableTab.value ?? ''),
);

/** the contact and tab whose record is being saved, as a `formKey` */
const savingKey = ref<string | null>(null);

/**
 * @author Polina Sukhorukova
 * The section saves, not the form: a tab switch drops the form mid-save, and an
 * unmounted form's emit is ignored, so the list would not learn of the new
 * record. The contact is reported stale whether the form is still open or not,
 * unless the panel has moved to another contact meanwhile, which it loads anew.
 * The first record on a tab becomes primary, as in CRM; a failure is notified
 * by api-services and leaves an open form with what was typed
 * [WS-171](https://webitel.atlassian.net/browse/WS-171)
 */
async function save(tab: AddableCommunicationTab, record: NewCommunication) {
	const contactId = props.contact.id ?? '';
	const key = toFormKey(contactId, tab);
	savingKey.value = key;
	try {
		await addCommunication(tab, contactId, record, {
			primary: !communication.value[tab].length,
		});
	} catch {
		return;
	} finally {
		if (savingKey.value === key) savingKey.value = null;
	}

	if (props.contact.id !== contactId) return;
	if (formKey.value === key) isAdding.value = false;
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
