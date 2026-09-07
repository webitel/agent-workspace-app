<template>
 <ws-page-wrapper class="the-contacts">
   <template #header>
   </template>
   <template #main>
     <wt-table
       class="the-contacts__table"
       :data="dataList"
       :headers="headers"
       :selected="selected"
       :lazy="true"
       :on-loading="handleIntersect"
       data-key="id"
       sortable
       @sort="updateSort"
       @update:selected="updateSelected"
     >

     </wt-table>
   </template>

 </ws-page-wrapper>
</template>

<script setup lang="ts">
import WsPageWrapper from '../../ws-page-wrapper.vue';
import {
	ContactsSearchMode,
	getContactAccessFromMode,
} from '@webitel/api-services/api';

const tableStore = useContactsDatalistStore();
</script>

<style scoped>

</style>
