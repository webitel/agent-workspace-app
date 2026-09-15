<template>
 <ws-page-wrapper
   class="the-contacts"
   search
   :tabs="tabs"
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
           <div class="the-contacts__username-wrapper">
             <wt-avatar
               size="xs"
               :username="item.name?.commonName"
             />

             <wt-item-link
               :link="contactLink(item.id)"
             >
               {{ item.name?.commonName }}
             </wt-item-link>
           </div>
         </template>

         <template #user="{ item }">
           <wt-icon
             v-if="item.user"
             icon="webitel-logo"
           />
         </template>

         <template #groups="{ item }">
           <table-cell-info
             icon="group"
             :items="getGroupItems(item)"
           />
         </template>

         <template #phones="{ item }">
           <table-cell-info
             icon="call"
             icon-color="success"
             :items="item.phones?.data"
             item-label="number"
           />
         </template>

         <template #managers="{ item }">
           <table-cell-info
             icon="user"
             :items="getManagerItems(item)"
           />
         </template>

         <template #about="{ item }">
           {{ item.about }}
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
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { WtTable } from '@webitel/ui-sdk/components';
import WsPageWrapper from '../../components/ws-page-wrapper.vue';
import TableCellInfo from '../../../components/table-cell-info.vue';
import type { WebitelContactsContact } from '@webitel/api-services/gen/models';
import { useContactsTabs } from './composables/useContactsTabs';
import { useContactsDataListStore } from './modules/contacts/store/contacts';
import { contactLink } from '../../../../app/scripts/contactLink';

const tableStore = useContactsDataListStore();
const { tabs } = useContactsTabs();

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
const searchValue = ref('');

const onLoading = async () => {
	if (!next.value && isFirstLoad.value) return;
	await appendToDataList();
	isFirstLoad.value = true;
};
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

function getGroupItems(item: WebitelContactsContact) {
	return item.groups?.data?.map(({ group }) => group).filter(Boolean) ?? [];
}

function getManagerItems(item: WebitelContactsContact) {
	return item.managers?.data?.map(({ user }) => user).filter(Boolean) ?? [];
}

initialize();
</script>

<style scoped>
.table-page {
  width: 100%;
}

.table-section {
  height: 100%;
}

.the-contacts__username-wrapper {
  display: flex;
  align-items: center;
}

</style>
