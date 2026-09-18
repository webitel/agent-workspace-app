<template>
    <section class="the-calls-workspace">
        <!--
            Only one tab exists today (Missed). wt-tabs is used anyway so
            adding Active/History later (separate tickets) is just another
            entry in `tabs` plus a v-if on the content below.
        -->
        <wt-tabs
            :current="currentTab"
            :tabs="tabs"
            @change="currentTab = $event"
        />
        <the-missed-calls v-if="currentTab.value === 'missed'" />
    </section>
</template>

<script setup lang="ts">
import { WtTabs } from '@webitel/ui-sdk/components';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import TheMissedCalls from '../../../../../features/calls/modules/missed-calls/components/the-missed-calls.vue';

const { t } = useI18n();

const tabs = [
	{
		value: 'missed',
		text: t('ui.pages.calls.tabs.missed'),
	},
];

const currentTab = ref(tabs[0]);
</script>

<style scoped>
.the-calls-workspace {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    width: 100%;
}
</style>