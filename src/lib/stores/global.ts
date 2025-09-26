import { writable } from 'svelte/store';

export const settings = writable<GuiSettings>({
	cwd: null,
	tuneinCrewDir: null,
	fmodDir: 'C:/Program Files (x86)/FMOD SoundSystem/FMOD Designer/fmod_designercl.exe',
	autoUpdate: {
		tuneInGui: true,
		tuneInCrew: true
	}
});
