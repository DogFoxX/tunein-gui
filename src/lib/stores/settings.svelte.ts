import { appDataDir, join } from '@tauri-apps/api/path';
import { load, Store } from '@tauri-apps/plugin-store';

interface TgSettings {
	autoUpdate: boolean;
	fmodDir?: string;
	keepTabs: boolean;
	logsDefaultOpen: boolean;
	tuneinCrew: {
		autoUpdate: boolean;
		dir?: string;
	};
}

interface TgSettingsAPI {
	close: () => void;
	isOpen: boolean;
	open: () => void;
	save: () => Promise<void>;
	state: TgSettings;
	tuneinCrewVersion?: string;
}

class LoadAppSettings {
	#settings_state = $state<TgSettings>({
		autoUpdate: true,
		logsDefaultOpen: false,
		keepTabs: true,
		tuneinCrew: {
			autoUpdate: true
		}
	});

	#tuneinCrewVersion = $state<string>();
	#settingsOpen = $state(false);

	public settings: TgSettingsAPI;

	constructor() {
		const self = this;

		this.settings = {
			close() {
				self.#settingsOpen = false;
			},
			open() {
				self.#settingsOpen = true;
			},
			async save() {
				const settingsStore = await Store.get('PersistentData/settings');

				if (settingsStore) {
					await settingsStore.set('settings_state', self.#settings_state);
				}
			},
			get isOpen() {
				return self.#settingsOpen;
			},
			set isOpen(v) {
				self.#settingsOpen = v;
			},
			get state() {
				return self.#settings_state;
			},
			set state(v) {
				self.#settings_state = v;
			},
			get tuneinCrewVersion() {
				return self.#tuneinCrewVersion;
			},
			set tuneinCrewVersion(v) {
				self.#tuneinCrewVersion = v;

				Store.get('PersistentData/settings').then((settingsStore) => {
					if (settingsStore) {
						settingsStore.set('tuneinCrewVersion', v).then(() => settingsStore.save());
					}
				});
			}
		};
	}

	static async init() {
		const { settings } = new LoadAppSettings();

		const dataDir = await appDataDir();
		const fmodDir = await join(dataDir, 'FMOD');
		const tuneinCrewDir = await join(dataDir, 'TuneinCrew');

		const settingsStore = await load('PersistentData/settings', {
			defaults: {
				settings_state: {
					...settings.state,
					fmodDir,
					tuneinCrew: { ...settings.state.tuneinCrew, dir: tuneinCrewDir }
				},
				tuneinCrewVersion: settings.tuneinCrewVersion
			}
		});

		await settingsStore.save();

		settings.state = (await settingsStore.get('settings_state')) as TgSettings;
		settings.tuneinCrewVersion = await settingsStore.get('tuneinCrewVersion');

		return { settings };
	}
}

const { settings } = await LoadAppSettings.init();

export default settings;
