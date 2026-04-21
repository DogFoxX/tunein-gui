import { writable } from 'svelte/store';
import { load, Store } from '@tauri-apps/plugin-store';
import { appDataDir, join } from '@tauri-apps/api/path';
import { boolean, object, string } from 'zod';

let tgStore: Store;

const SettingsSchema = object({
	autoUpdate: boolean(),
	fmodDir: string(),
	keepTabs: boolean(),
	logsDefaultOpen: boolean(),
	tuneinCrew: object({
		autoUpdate: boolean(),
		dir: string(),
		version: string()
	})
});

function loadSettings() {
	const { set, subscribe, update } = writable<TgSettings>();

	const settingsOpen = writable(false);

	return {
		update,
		set,
		subscribe,
		async init() {
			const appdir = await appDataDir();

			tgStore = await load('settings.json', {
				defaults: {
					settings: {
						autoUpdate: true,
						fmodDir: await join(appdir, 'FMOD'),
						keepTabs: true,
						logsDefaultOpen: false,
						tuneinCrew: {
							autoUpdate: true,
							dir: await join(appdir, 'Tunein Crew'),
							version: 'N/A'
						}
					}
				}
			});
			await tgStore.save();

			let currentSettings = (await tgStore.get('settings')) as TgSettings;

			const result = SettingsSchema.safeParse(currentSettings);

			if (!result.success) {
				await tgStore.reset();
				currentSettings = (await tgStore.get('settings')) as TgSettings;
			}

			return currentSettings;
		},
		async save(newSettings: TgSettings) {
			await tgStore.set('settings', newSettings);
			settings.set((await tgStore.get('settings')) as TgSettings);
		},
		open() {
			settingsOpen.set(true);
		},
		settingsOpen
	};
}

const settings = loadSettings();
export default settings;
