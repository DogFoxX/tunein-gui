/// <reference types="svelte" />
/// <reference types="vite/client" />

interface MetadataResult {
	id?: number | null;
	file?: string | null;
	text?: string | null;
	name?: string | null;
	artist?: string | null;
	year?: string | null;
	length?: string | null;
	error?: string | null;
}

interface Track {
	file: string;
	name: string;
	artist: string;
	year: string;
	length: string;
	force?: string | null;
}

interface XmlObj {
	project: {
		fmod: string;
		radio: {
			id: string;
			name: string;
			logo: string;
			songs?: {
				song: Track;
			}[];
		};
	};
}

interface DragDropEventPayload {
	paths: string[];
	position: { x: number; y: number };
}
