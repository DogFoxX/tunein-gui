import { load, type Store } from '@tauri-apps/plugin-store';
import { appDataDir, join, homeDir } from '@tauri-apps/api/path';

let store: Store;

const settStore = {
	init: async () => {
		const home = await homeDir();

		store = await load('settings.json', {
			defaults: {
				settings: {
					cwd: await join(home, 'Tunein', 'Stations'),
					tuneinCrew: {
						version: 'N/A',
						dir: await join(home, 'Tunein', 'TuneinCrew')
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

		return (await store.get('settings')) as GuiSettings;
	},
	get: async () => {
		return (await store.get('settings')) as GuiSettings;
	},
	set: async (settings: GuiSettings) => {
		return await store.set('settings', settings);
	}
};

export default settStore;
