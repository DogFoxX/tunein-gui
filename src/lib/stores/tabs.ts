import { writable, get } from 'svelte/store';
import { load } from '@tauri-apps/plugin-store';
import settings from './settings';

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

			subscribe(async (newTabs) => {
				if (!get(settings).keepTabs) return;

				await tgStore.set('tabs', newTabs);
				tgStore.save();
			});

			if (get(settings).keepTabs) set(currentTabs);
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
		add() {
			update((tabs) => [
				...tabs.map((t) => ({ ...t, active: false })),
				{
					id: crypto.randomUUID(),
					active: true
				}
			]);
		},
		close(id: string) {
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
