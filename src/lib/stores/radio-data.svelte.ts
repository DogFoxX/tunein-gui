async function loadRadioData() {
	let data_state = $state<TgRadioData[]>([]);
	let configurer = $state<{ header?: string; open: boolean; tabId?: string }>({ open: false });

	return {
		get state() {
			return data_state;
		},
		set state(data) {
			data_state = data;
		},
		get configurer() {
			return configurer;
		},
		openConfig(
			options: { header?: string; tabId?: string } = { header: 'Create a New Radio' }
		) {
			configurer = {
				header: options.header,
				open: true,
				tabId: options.tabId
			};
		},
		closeConfig() {
			configurer = { open: false };
		}
	};
}

const radioData = await loadRadioData();

export default radioData;
