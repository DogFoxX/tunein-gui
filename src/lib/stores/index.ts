export { default as radioData } from './radio-data.svelte';
export { default as settings } from './settings.svelte';
export { tables, tabs } from './states.svelte';

import { writable } from 'svelte/store';

export const updateAvailable = writable<boolean>();
