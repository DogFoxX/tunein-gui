import { getCurrentWindow } from '@tauri-apps/api/window';
import { load, Store } from '@tauri-apps/plugin-store';
import { appDataDir, join } from '@tauri-apps/api/path';
import { remove, exists } from '@tauri-apps/plugin-fs';
import settings from './settings.svelte';
import radioData from './radio-data.svelte';

interface TgTabState {
	active?: boolean;
	id: string;
}

interface TgTableState {
	ascending: boolean;
	fields: {
		sort?: boolean;
		width?: number;
	}[];
}

interface TgTablesAPI {
	jingles_table: TgTableState;
	songs_table: TgTableState;
}

interface TgTabsAPI {
	state: TgTabState[];
	activate: (id: string) => void;
	addOrModify: (data: TgRadioData) => void;
	close: (id: string) => Promise<void>;
	clear: () => Promise<void>;
}

const appWindow = getCurrentWindow();

class LoadAppStates {
	// Private tabs state
	// This is because we return it in a public 'tabs.state'
	#tabs_state = $state<TgTabState[]>([]);

	// Public tables state
	// Svelte will automatically subscribe to '{get(), set()}'
	tables = $state<TgTablesAPI>({
		jingles_table: {
			ascending: false,
			fields: []
		},
		songs_table: {
			ascending: false,
			fields: []
		}
	});

	public tabs: TgTabsAPI;

	constructor() {
		const self = this;

		// We construct the tabs object, where 'state' is the Svelte Rune $state
		this.tabs = {
			// set 'get() and 'set()'
			get state() {
				return self.#tabs_state;
			},
			set state(v) {
				self.#tabs_state = v;
			},
			// Function to active a tab by 'id'
			activate(id: string) {
				self.#tabs_state = self.#tabs_state.map((t) => ({
					...t,
					active: t.id === id
				}));
			},
			// We add a new tab if there is no 'tabId' associated with a tab
			// Otherwise we modify the data where the 'tabId' in a found radioData store is equal to a tab's id
			addOrModify(data: any) {
				const exists = radioData.state.some((item) => item.tabId === data.tabId);

				radioData.state = exists
					? radioData.state.map((item) => (item.tabId === data.tabId ? data : item))
					: [...radioData.state, data];

				if (!exists) {
					self.#tabs_state = [
						...self.#tabs_state.map((t) => ({ ...t, active: false })),
						{ id: data.tabId, active: true }
					];
				}
			},
			// Tab close function
			async close(id: string) {
				// Remove the radioData tauri store associated with a tab
				const appDir = await appDataDir();
				const tempPath = await join(appDir, `PersistentData/_temp/temp_${id}`);

				if (await exists(tempPath)) {
					await remove(tempPath);
				}

				// Find this tab's index by id
				const index = self.#tabs_state.findIndex((t) => t.id === id);

				// If the tab being removed was active, then set the tab to right of to active
				if (index === -1) return;

				const wasActive = self.#tabs_state[index].active;
				const newState = self.#tabs_state.filter((t) => t.id !== id);

				if (!wasActive) {
					self.#tabs_state = newState;
				} else {
					const newActiveIndex = Math.max(0, index - 1);

					self.#tabs_state = newState.map((t, i) => ({
						...t,
						active: i === newActiveIndex
					}));
				}
			},

			async clear() {
				const tabsStore = await Store.get('PersistentData/states/tabs.state');

				if (tabsStore) {
					const currentTabs = (await tabsStore.get('tabs_state')) as TgTabState[];

					await Promise.all(
						currentTabs.map(async ({ id }) => {
							const appDir = await appDataDir();
							const path = await join(appDir, `PersistentData/_temp/temp_${id}`);

							if (await exists(path)) {
								await remove(path);
							}
						})
					);

					await tabsStore.clear();
				}
			}
		};
	}

	static async init() {
		const { tables, tabs } = new LoadAppStates();

		const tabsStore = await load('PersistentData/states/tabs.state', {
			defaults: {
				tabs_state: tabs.state
			},
			autoSave: false
		});

		const tablesStore = await load('PersistentData/states/tables.state', {
			defaults: {
				jingles_table: {
					ascending: false,
					fields: []
				},
				songs_table: {
					ascending: false,
					fields: []
				}
			}
		});

		// Create the store immediately
		await tabsStore.save();
		await tablesStore.save();

		// Load previously saved table states
		tables.jingles_table = (await tablesStore.get('jingles_table')) as TgTableState;
		tables.songs_table = (await tablesStore.get('songs_table')) as TgTableState;

		// 	// Load previously saved tabs state from store if settings.keepTabs is enabled
		if (settings.state.keepTabs) {
			tabs.state = (await tabsStore.get('tabs_state')) as TgTabState[];

			if (tabs.state.length) {
				radioData.state = await Promise.all(
					tabs.state.map(async ({ id }) => {
						const store = await load(`PersistentData/_temp/temp_${id}`);
						const data = (await store.get('radioData')) as TgRadioData;
						return data;
					})
				);
			}
		}

		return { tables, tabs };
	}
}

export const { tables, tabs } = await LoadAppStates.init();

// Save stores to disk before closing
appWindow.onCloseRequested(async (e) => {
	// Prevent immediate close
	e.preventDefault();

	// Save tables state
	const tableStore = await Store.get('PersistentData/states/tables.state');

	if (tableStore) {
		await tableStore.set('jingles_table', tables.jingles_table);
		await tableStore.set('songs_table', tables.songs_table);
	}

	// Save tabs state and temporary radioData.state if settings.keepTabs is enabled before closing the window
	if (settings.state.keepTabs) {
		const tabsStore = await Store.get('PersistentData/states/tabs.state');

		if (tabsStore) {
			await tabsStore.set('tabs_state', tabs.state);
			await tabsStore.save();
		}

		await Promise.all(
			radioData.state.map(async ({ tabId }) => {
				const store = await load(`PersistentData/_temp/temp_${tabId}`);
				await store.set(
					'radioData',
					radioData.state.find((data) => data.tabId == tabId)
				);
				return await store.save();
			})
		);
	}

	await appWindow.destroy();
});
