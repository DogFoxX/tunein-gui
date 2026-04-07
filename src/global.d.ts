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

enum NexusDirectionEnum {
	ASC,
	DESC
}

interface TgSettings {
	autoUpdate: boolean;
	fmodDir: string;
	keepTabs: boolean;
	logsDefaultOpen: boolean;
	nexusMods: {
		enabled: boolean;
		sort: [
			{
				createdAt?: { direction: NexusDirectionEnum };
				downloads?: { direction: NexusDirectionEnum };
				endorsements?: { direction: NexusDirectionEnum };
				updatedAt?: { direction: NexusDirectionEnum };
			}
		];
	};
	tuneinCrew: {
		autoUpdate: boolean;
		dir: string;
		version?: string;
	};
}

interface GuiUpdateDownload {
	install: () => Promise<void>;
}
