<template>
 <ws-page-wrapper
   class="the-contacts"
   search
   v-model:search-value="searchValue"
   @search="handleSearch"
 >
   <template #header>
     Contacts
   </template>
   <template #main>
     <div
       v-show="dataList.length"
       class="table-wrapper"
     >
       <wt-table
         v-if="dataList.length"
         class="the-contacts__table"
         :data="dataList"
         :headers="headers"
         :selected="selected"
         :lazy="true"
         :on-loading="onLoading"
         data-key="id"
         sortable
       >
         <template #name="{ item }">
           <div class="username-wrapper">
             <wt-avatar
               size="xs"
               :username="item.name?.commonName"
             />

  <!--           <wt-item-link-->
  <!--             :link="{-->
  <!--                  name: `${CrmSections.Contacts}-card`,-->
  <!--                  params: { id: item.id },-->
  <!--                }"-->
  <!--           >-->
  <!--             {{ item.name?.commonName }}-->
  <!--           </wt-item-link>-->
           </div>
         </template>

         <template #user="{ item }">
           <wt-icon
             v-if="item.user"
             icon="webitel-logo"
           />
         </template>

         <template #about="{ item }">
           {{ item.about }}
         </template>

         <template #managers="{ item }">
           {{ item.managers?.data?.[0]?.user?.name }}
         </template>

         <template #labels="{ item }">
           <div
             v-if="item.labels?.data"
             class="contacts-labels-wrapper"
           >
             <wt-chip
               v-for="{ label, id } of item.labels.data"
               :key="id"
             >
               {{ label }}
             </wt-chip>
           </div>
         </template>

         <template #actions="{ item }">
           <slot name="actions" :item="item" />
         </template>

       </wt-table>
     </div>
   </template>

 </ws-page-wrapper>
</template>

<script setup lang="ts">
import WsPageWrapper from '../../components/ws-page-wrapper.vue';
import {
	ContactsSearchMode,
	getContactAccessFromMode,
} from '@webitel/api-services/api';
import { useContactsDataListStore } from './modules/contacts/store/contacts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const tableStore = useContactsDataListStore();

const {
	initialize,
	loadDataList,
	appendToDataList,
	hasFilter,
	addFilter,
	updateFilter,
	deleteFilter,
} = tableStore;

const { dataList, selected, isLoading, headers, page, size, next, error } =
	storeToRefs(tableStore);

const isFirstLoad = ref(false);
const onLoading = async () => {
	if (!next.value && isFirstLoad.value) return;
	await appendToDataList();
	isFirstLoad.value = true;
};

const searchValue = ref('');
const handleSearch = (value: string) => {
	if (!value) {
		if (hasFilter('search'))
			deleteFilter({
				name: 'search',
			});
		return;
	}
	hasFilter('search')
		? updateFilter({
				name: 'search',
				value,
			})
		: addFilter({
				name: 'search',
				value,
			});
};

initialize();
</script>

<style scoped>
.table-page {
  width: 100%;
}

.table-section {
  height: 100%;
}

</style>
