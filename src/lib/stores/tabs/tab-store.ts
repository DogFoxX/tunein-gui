import { writable } from 'svelte/store';
import { load } from '@tauri-apps/plugin-store';
import type { TabType } from './types';

export const tabStore = writable<TabType[]>([]);

async function tabState() {
	const tgStore = await load('tab-state.json', {
		defaults: { tabs: [] }
	});

	await tgStore.save();

	const currentTabs = (await tgStore.get('tabs')) as TabType[];

	tabStore.subscribe(async (newTabs) => {
		await tgStore.set('tabs', newTabs);
		tgStore.save();
	});

	return {
		init() {
			tabStore.set(currentTabs);
		}
	};
}

export default tabState;
