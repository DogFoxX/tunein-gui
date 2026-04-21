import { writable } from 'svelte/store';

export const modelOpen = writable(false);

export { default as Modal } from './modal.svelte';
export { About, RadioConfig, Settings } from './modals';
