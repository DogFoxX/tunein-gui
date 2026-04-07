export { default as settings } from './settings';
export { default as tabStore } from './tabs';

import { writable } from 'svelte/store';

export const updateAvailable = writable<boolean>();
