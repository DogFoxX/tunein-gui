import { writable } from 'svelte/store';

export const logoPath = writable<string>();
export const stdOut = writable<string[]>([]);
export const unsaved = writable<boolean>();
