export { default as settings } from './settings.store';
export { default as tabStore } from './tabs.store';

import { writable } from 'svelte/store';

export const updateAvailable = writable<boolean>();
