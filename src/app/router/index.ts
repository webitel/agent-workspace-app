import { createRouter, createWebHistory } from 'vue-router';

export let router = null;

export const initRouter = async ({}) => {
	router = createRouter({
		history: createWebHistory(import.meta.env.BASE_URL),
		routes: [],
	});
};
