import { load } from '@tauri-apps/plugin-store';
import { appDataDir, resolveResource, join } from '@tauri-apps/api/path';

async function initSettings() {
	const exePath = await resolveResource('.');

	const appData = await appDataDir();

	return await load('settings.json', {
		defaults: {
			settings: {
				cwd: await join(exePath, 'stations'),
				tuneinCrew: {
					version: null,
					dir: await join(appData, 'TuneinCrew\\TuneinCrew.exe')
				},
				fmodDir:
					'C:\\Program Files (x86)\\FMOD SoundSystem\\FMOD Designer\\fmod_designercl.exe',
				autoUpdate: {
					gui: true,
					tuneinCrew: true
				}
			}
		}
	});
}

export default initSettings;
