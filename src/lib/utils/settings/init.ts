import { load } from '@tauri-apps/plugin-store';
import { appDataDir, resolveResource, join } from '@tauri-apps/api/path';

async function initSettings() {
	const exePath = await resolveResource('.');

	const appData = await appDataDir();

	const store = await load('settings.json', {
		defaults: {
			settings: {
				cwd: await join(exePath, 'stations'),
				tuneinCrew: {
					version: null,
					dir: await join(appData, 'TuneinCrew\\TuneinCrew.exe')
				},
				fmodDir: '',
				autoUpdate: {
					gui: true,
					tuneinCrew: true
				}
			}
		}
	});

	await store.save();

	return store;
}

export default initSettings;
