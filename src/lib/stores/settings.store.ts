import { Store } from '@tauri-apps/plugin-store';
import { writable } from 'svelte/store';

export const store = writable<Store>();
export const settingsOpen = writable(false);
export const settings = writable<GuiSettings>();
