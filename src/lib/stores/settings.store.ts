import { writable } from 'svelte/store';
import { xmlData } from './xml-obj.store';

export const settingsOpen = writable(false);
export const settings = writable<GuiSettings>();
export const tableState = writable<TableState>();

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
