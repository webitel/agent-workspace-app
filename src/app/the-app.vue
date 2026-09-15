<template>
  <router-view />
</template>

<script setup lang="ts">
import { computed, provide } from 'vue';

import { useAppearanceStore } from '../features/appearance/store/appearanceStore';

const appearanceStore = useAppearanceStore();
const darkMode = computed(() => appearanceStore.darkMode);

provide('darkMode', darkMode);
</script>

<style scoped></style>
