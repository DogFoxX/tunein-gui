import { writable } from 'svelte/store';

export const stdOut = writable<string[]>([]);
