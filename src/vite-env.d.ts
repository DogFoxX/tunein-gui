/// <reference types="svelte" />
/// <reference types="vite/client" />

interface GuiSettings {
	workingDir: string | null;
	tuneinCrewDir: string;
	fmodDir: string;
	autoUpdate: {
		tuneInGui: boolean;
		tuneInCrew: boolean;
	};
}

interface TrackData {
	file?: string;
	name?: string;
	artist?: string;
	year?: string;
	length?: string;
	force?: string;
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
