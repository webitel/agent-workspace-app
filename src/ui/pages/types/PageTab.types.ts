import type { Component } from 'vue';
import type { WsPageTab } from '../components/ws-page-wrapper.vue';

export interface PageTab<TStore = unknown> extends WsPageTab {
	component: Component;
	actionPanel?: Component;
	store?: TStore;
}
