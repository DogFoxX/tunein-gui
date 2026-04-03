/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Window {
	openedFile?: string;
}

interface TgTabs {
	active: boolean;
	id: string;
	title?: string;
}

interface NexusMods {
	modId: number;
	name: string;
	pictureUrl: string;
	endorsements: number;
	author: string;
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

interface TgSettings {
	tuneinCrew?: {
		version: string;
		dir: string;
	};
	fmodDir?: string;
	autoUpdate: {
		gui: boolean;
		tuneinCrew: boolean;
	};
	keepTabs: boolean;
	logsDefaultOpen: boolean;
}
