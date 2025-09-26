import { writable } from 'svelte/store';

export const settings = writable<GuiSettings>({
	workingDir: null,
	tuneinCrewDir: '',
	fmodDir: '',
	autoUpdate: {
		tuneInGui: true,
		tuneInCrew: true
	}
});
