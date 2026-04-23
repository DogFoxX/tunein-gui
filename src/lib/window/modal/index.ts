import { writable } from 'svelte/store';

export const modalOpen = writable(false);

export { default as Modal } from './modal.svelte';
export { About, RadioConfig, Settings } from './modals';
