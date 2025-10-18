import { load, type Store } from '@tauri-apps/plugin-store';
import { appDataDir, join, homeDir } from '@tauri-apps/api/path';

let settStore: Store;

const store = {
	init: async () => {
		const home = await homeDir();
		const appData = await appDataDir();

		settStore = await load('settings.json', {
			defaults: {
				settings: {
					cwd: await join(home, 'Tunein', 'Stations'),
					tuneinCrew: {
						version: null,
						dir: await join(appData, 'TuneinCrew', 'TuneinCrew.exe')
					},
					fmodDir: '',
					autoUpdate: {
						gui: true,
						tuneinCrew: true
					}
				}
			}
		});
		await settStore.save();
	},
	get: async () => {
		return (await settStore.get('settings')) as GuiSettings;
	},
	set: async (settings: GuiSettings) => {
		return await settStore.set('settings', settings);
	}
};

export default store;
