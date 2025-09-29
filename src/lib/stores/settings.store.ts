import { Store } from '@tauri-apps/plugin-store';
import { writable, get } from 'svelte/store';
import { xmlData } from './xml-obj.store';

export const store = writable<Store>();
export const settingsOpen = writable(false);
export const settings = writable<GuiSettings>();

settings.subscribe((settings) => {
	if (settings) {
		xmlData.update((data) => ({
			...data,
			project: {
				...data.project,
				fmod: settings.fmodDir
			}
		}));
	}
});
