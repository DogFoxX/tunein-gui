/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Window {
	openedFile?: string;
}

interface TgTabs {
	active?: boolean;
	id: string;
}

interface NexusMods {
	modId: number;
	name: string;
	pictureUrl: string;
	endorsements: number;
	author: string;
}

interface RadioData {
	configuration: {
		radioId?: string;
		radioName?: string;
		logo: {
			crop: {
				point: { x: number; y: number };
				shape: number;
				zoom: number;
			};
			data?: Base64URLString | null;
		};
		logoPath?: string | null;
		force: {
			enabled: boolean;
			value: string;
		};
		volume: {
			enabled: boolean;
			value: string;
		};
	};
	tabId: string;
	tracks?: {
		jingles?: {
			filename: string;
			file: string;
		}[];
		songs?: {
			filename: string;
			file: string;
			artist?: string;
			name?: string;
			year?: string;
			length?: string;
			measuredVolume?: string;
		}[];
	};
}

interface XMLData {
	project: {
		radio?: {
			id?: string;
			name?: string;
			jingles?: {
				file: string[];
			};
			songs?: {
				song: {
					file: string;
					artist?: string;
					name?: string;
					year?: number;
					length?: string;
					volume?: number;
					force?: number;
				}[];
			};
		};
	};
}

enum NexusDirectionEnum {
	ASC,
	DESC
}

interface TgSettings {
	autoUpdate: boolean;
	fmodDir: string;
	keepTabs: boolean;
	logsDefaultOpen: boolean;
	tuneinCrew: {
		autoUpdate: boolean;
		dir: string;
		version?: string;
	};
}

interface GuiUpdateDownload {
	install: () => Promise<void>;
}
