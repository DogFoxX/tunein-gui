/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Window {
	openedFile?: string;
}

interface GuiSettings {
	cwd: string;
	tuneinCrew: {
		version: string;
		dir: string;
		installed: boolean;
	};
	fmodDir: string;
	autoUpdate: {
		gui: boolean;
		tuneinCrew: boolean;
	};
}

interface TableState {
	fields: {
		sort?: boolean;
		width: number;
	}[];
	ascending: boolean;
}

interface TrackXMLData {
	file?: string;
	name?: string;
	artist?: string;
	year?: string;
	length?: string;
	force?: string;
	volume?: string;
}

interface TrackTableInfo {
	id: string;
	number?: string;
	filename: string;
	measured_volume?: string;
	artist?: string;
	name?: string;
	year?: string;
	length?: string;
	path?: string;
}

interface XmlData {
	project: {
		fmod: string;
		radio: {
			id?: string;
			name?: string;
			logo?: string;
			songs?: {
				song: TrackXMLData;
			}[];
		};
	};
}

interface ProfileData {
	name?: string;
	radioData?: string;
	force: {
		enable: boolean;
		value: string;
	};
	targetVolume: {
		enable: boolean;
		value: string;
	};
	trackData?: {
		track: {
			number: string;
			volume: string;
		};
	}[];
}

interface DragDropEventPayload {
	paths: string[];
	position: { x: number; y: number };
}

interface UpdateAvailable {
	version?: number;
}
