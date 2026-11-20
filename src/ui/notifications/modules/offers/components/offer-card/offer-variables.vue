<template>
    <div class="offer-variables">
        <div class="offer-variables__list">
            <offer-source-line
                v-for="(variable, index) in shownVariables"
                :key="`${index}:${variable.label}`"
                :source="variable"
            />
        </div>
        <!-- .stop: a chat's card body opens the chat (AC_06.01.04), the toggle must not -->
        <wt-icon-btn
            v-if="isCollapsible"
            class="offer-variables__toggle"
            :icon="isExpanded ? 'arrow-up' : 'arrow-down'"
            :size="ComponentSize.SM"
            @click.stop="isExpanded = !isExpanded"
        />
    </div>
</template>

<script
    setup
    lang="ts"
>
import { WtIconBtn } from '@webitel/ui-sdk/components';
import { ComponentSize } from '@webitel/ui-sdk/enums';
import { computed, ref } from 'vue';

import type { OfferSource } from '../../types/Offer.types';
import OfferSourceLine from './offer-source-line.vue';

/**
 * The schema's variables under the queue line. Collapsed, it shows the first
 * few; the toggle appears only when that hides something (AC_06.01.06).
 */
const COLLAPSED_VARIABLES_COUNT = 3;

const { variables } = defineProps<{
	variables: OfferSource[];
}>();

const isExpanded = ref(false);

const isCollapsible = computed(
	() => variables.length > COLLAPSED_VARIABLES_COUNT,
);

const shownVariables = computed(() =>
	isExpanded.value ? variables : variables.slice(0, COLLAPSED_VARIABLES_COUNT),
);
</script>

<style scoped>
.offer-variables {
    display: flex;
    gap: var(--spacing-2xs, 4px);
    align-items: flex-end;
    width: 100%;
}

.offer-variables__list {
    flex: 1;
    min-width: 0;
}
</style>
