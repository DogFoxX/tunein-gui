import { writable, get } from 'svelte/store';
import { load } from '@tauri-apps/plugin-store';
import { appDataDir, join } from '@tauri-apps/api/path';
import { remove, exists } from '@tauri-apps/plugin-fs';
import settings from './settings.store';
import radioDataStore from './radio-data.store';

function loadTabs() {
	const { subscribe, update, set } = writable<TgTabs[]>([]);

	return {
		subscribe,
		update,
		set,
		async init() {
			const tgStore = await load('tab-state.json', {
				defaults: { tabs: [] }
			});

			await tgStore.save();

			const currentTabs = (await tgStore.get('tabs')) as TgTabs[];

			if (!get(settings).keepTabs) return;

			subscribe(async (tabs) => {
				await tgStore.set('tabs', tabs);
			});

			const tempData = await Promise.all(
				currentTabs.map(async ({ id }) => {
					const store = await load(`_temp/temp_${id}`);
					const data = (await store.get('radioData')) as RadioData;

					await store.close();

					return data;
				})
			);

			if (tempData) radioDataStore.set(tempData);

			set(currentTabs);
		},
		activate(id: string) {
			if (id === 'home') {
				update((tabs) => tabs.map((t) => ({ ...t, active: false })));
				return;
			}

			update((tabs) =>
				tabs.map((t) => ({
					...t,
					active: t.id === id
				}))
			);
		},
		close(id: string) {
			appDataDir().then(async (dataDir) => {
				const tempDataFile = await join(dataDir, `_temp/temp_${id}`);
				const exist = await exists(tempDataFile);

				if (exist) await remove(tempDataFile);
			});

			update((tabs) => {
				const index = tabs.findIndex((t) => t.id === id);
				if (index === -1) return tabs;

				const wasActive = tabs[index].active;
				const newTabs = tabs.filter((t) => t.id !== id);

				if (!wasActive) return newTabs;

				const newActiveIndex = Math.max(0, index - 1);

				return newTabs.map((t, i) => ({
					...t,
					active: i === newActiveIndex
				}));
			});
		}
	};
}

const tabStore = loadTabs();

export default tabStore;
