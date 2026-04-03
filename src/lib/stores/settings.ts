import { writable, get } from 'svelte/store';
import { load, Store } from '@tauri-apps/plugin-store';
import { appDataDir, join } from '@tauri-apps/api/path';

const defaultSettings: TgSettings = {
	autoUpdate: {
		gui: true,
		tuneinCrew: true
	},
	keepTabs: true,
	logsDefaultOpen: false
};

let tgStore: Store;

function loadSettings() {
	const settings = writable<TgSettings>();

	const isOpen = writable(false);

	return {
		update: settings.update,
		set: settings.set,
		subscribe: settings.subscribe,
		async init() {
			const appdir = await appDataDir();

			tgStore = await load('settings.json', {
				defaults: {
					settings: {
						...defaultSettings,
						tuneinCrew: {
							...defaultSettings.tuneinCrew,
							dir: await join(appdir, 'Tunein Crew')
						},
						fmodDir: await join(appdir, 'FMOD')
					}
				}
			});
			await tgStore.save();

			const currentSettings = (await tgStore.get('settings')) as TgSettings;

			settings.set(currentSettings);

			return currentSettings;
		},
		async save(newSettings: TgSettings) {
			await tgStore.set('settings', newSettings);
			settings.set((await tgStore.get('settings')) as TgSettings);
		},
		open() {
			isOpen.set(true);
		},
		close() {
			isOpen.set(false);
		},
		isOpen
	};
}

const settings = loadSettings();
export default settings;
