/// <reference types="svelte" />
/// <reference types="vite/client" />

interface GuiSettings {
	cwd: string;
	tuneinCrew: {
		version: string | null;
		dir: string;
	};
	fmodDir: string;
	autoUpdate: {
		gui: boolean;
		tuneinCrew: boolean;
	};
}

interface TrackData {
	file?: string | null;
	name?: string | null;
	artist?: string | null;
	year?: string | null;
	length?: string | null;
	force?: string | null;
	volume_db?: string | null;
}

interface XmlData {
	project: {
		fmod: string;
		radio: {
			id: string;
			name: string;
			logo: string;
			songs?: {
				song: TrackData;
			}[];
		};
	};
}

interface DragDropEventPayload {
	paths: string[];
	position: { x: number; y: number };
}

interface UpdateAvailable {
	version?: number;
}
