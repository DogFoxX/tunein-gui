import { load, type Store } from '@tauri-apps/plugin-store';

let tableSett: Store;

const tableOpts = {
	init: async () => {
		tableSett = await load('table-opts.json', {
			defaults: {
				table_opts: {
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

		await tableSett.save();
	},
	get: async () => {
		await tableOpts.init();
		return (await tableSett.get('table_opts')) as TableOpts;
	},
	set: async (tableOpts: TableOpts) => {
		return await tableSett.set('table_opts', tableOpts);
	}
};

export default tableOpts;
