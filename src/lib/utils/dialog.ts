import { open, save, type DialogFilter } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { xml2obj } from './xml-convert';
import { tracks, xmlData } from '$lib/stores/xml-obj.store';

export async function openFileDiag(args: {
	title: string;
	filters: DialogFilter[];
	multiple: boolean;
}): Promise<object[] | any> {
	const { title, filters, multiple } = args;

	return open({ title, filters, multiple });
}

export async function openDirDiag(args: { title: string }): Promise<string[] | any> {
	const { title } = args;

	return open({ title, directory: true, multiple: false, canCreateDirectories: true });
}

export async function openXML(): Promise<void> {
	const path = await open({
		title: 'Import XML',
		defaultPath: 'station.xml',
		multiple: false,
		canCreateDirectories: false,
		filters: [{ extensions: ['xml'], name: 'XML Files' }]
	});

	if (!path || typeof path !== 'string') return;

	const xmlString = await readTextFile(path);
	const parsed: XmlData = xml2obj(xmlString) as XmlData;

	// Ensure structure exists
	parsed.project = parsed.project ?? {
		fmod: '',
		radio: { id: '', name: '', logo: '', songs: [] }
	};
	parsed.project.radio.songs = Array.isArray(parsed.project.radio.songs)
		? parsed.project.radio.songs
		: [];

	xmlData.set(parsed);

	const songs: TrackData[] = parsed.project.radio.songs.map((s) => s.song);
	tracks.set(songs);
}

export async function saveXML(xml: string) {
	const path = await save({
		title: 'Export XML',
		defaultPath: 'station.xml',
		canCreateDirectories: true,
		filters: [{ extensions: ['xml'], name: 'XML Files' }]
	});

	if (!path) return;

	return await writeTextFile(path, xml);
}
