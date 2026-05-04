interface Configurer {
	header?: string;
	open: boolean;
	tabId?: string;
}

interface RadioDataAPI {
	closeConfig: () => void;
	configurer: Configurer;
	openConfig: (options?: { header?: string; tabId?: string }) => void;
	state: TgRadioData[];
}

class LoadRadioData {
	#data_state = $state<TgRadioData[]>([]);
	#configurer = $state<Configurer>({ open: false });

	public radioData: RadioDataAPI;

	constructor() {
		const self = this;

		this.radioData = {
			closeConfig() {
				self.#configurer = { open: false };
			},
			get configurer() {
				return self.#configurer;
			},
			openConfig(options = { header: 'Create a New Radio' }) {
				self.#configurer = {
					header: options.header,
					open: true,
					tabId: options.tabId
				};
			},
			get state() {
				return self.#data_state;
			},
			set state(v) {
				self.#data_state = v;
			}
		};
	}
}

const { radioData } = new LoadRadioData();

export default radioData;
