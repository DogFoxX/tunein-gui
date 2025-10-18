import { load, type Store } from '@tauri-apps/plugin-store';

let store: Store;

const tableStore = {
	init: async () => {
		store = await load('table-state.json', {
			defaults: {
				table_state: {
					fields: [
						{
							sort: true,
							width: 48
						},
						{
							width: 160
						},
						{
							width: 160
						},
						{
							width: 160
						},
						{
							width: 160
						},
						{
							width: 64
						},
						{
							width: 64
						},
						{
							width: 224
						}
					],
					ascending: false
				}
			}
		});

		await store.save();

		return (await store.get('table_state')) as TableState;
	},
	get: async () => {
		return (await store.get('table_state')) as TableState;
	},
	set: async (tableOpts: TableState) => {
		return await store.set('table_state', tableOpts);
	}
};

export default tableStore;
