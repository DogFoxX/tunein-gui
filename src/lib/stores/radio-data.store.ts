import { writable, get } from 'svelte/store';
import { load } from '@tauri-apps/plugin-store';
import tabStore from './tabs.store';
import settings from './settings.store';

function initRadioData() {
	const { set, subscribe, update } = writable<RadioData[]>([]);
	const radioConfigurer = writable<{ header?: string; open: boolean; tabId?: string }>({
		open: false
	});

	subscribe(async (radioData) => {
		const currentSettings = get(settings);
		if (currentSettings && !currentSettings.keepTabs) return;

		await Promise.all(
			radioData.map(async ({ tabId }) => {
				const store = await load(`_temp/temp_${tabId}`);
				await store.set(
					'radioData',
					radioData.find((data) => data.tabId == tabId)
				);
				return await store.save();
			})
		);
	});

	return {
		set,
		subscribe,
		update,
		openConfig(
			options: { header?: string; tabId?: string } = { header: 'Create a New Radio' }
		) {
			radioConfigurer.set({
				header: options.header,
				open: true,
				tabId: options.tabId
			});
		},
		closeConfig() {
			radioConfigurer.update(() => ({ open: false }));
		},
		add(data: RadioData) {
			let wasAdded = false;

			update((radioData) => {
				const exists = radioData.some(({ tabId }) => tabId === data.tabId);

				if (exists) {
					return radioData.map((item) =>
						item.tabId === data.tabId ? { ...item, ...data } : item
					);
				}

				wasAdded = true;
				return [...radioData, data];
			});

			if (wasAdded) {
				tabStore.update((tabs) => [
					...tabs.map((t) => ({ ...t, active: false })),
					{
						id: data.tabId,
						active: true
					}
				]);
			}
		},
		radioConfigurer
	};
}

const radioDataStore = initRadioData();

export default radioDataStore;
