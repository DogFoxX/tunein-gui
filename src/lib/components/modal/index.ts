import { writable } from 'svelte/store';

export { default as Modal } from './modal.svelte';
export { RadioConfigModal, SettingsModal } from './modals';

export const modalOpen = writable(false);
