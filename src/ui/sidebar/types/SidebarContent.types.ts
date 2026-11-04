import type { Component } from 'vue';

export interface SidebarContent {
	component: Component;
	props?: Record<string, unknown>;
}
