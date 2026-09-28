import type { Store } from 'pinia';
import type { Component } from 'vue';

export interface PageTab<TStore = Store> {
	text: string;
	value: string;
	pathName: string;
	component: Component;
	actionPanel?: Component;
	store?: TStore;
}
