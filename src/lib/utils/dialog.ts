import { open, type DialogFilter } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile, copyFile } from '@tauri-apps/plugin-fs';
import { dirname, isAbsolute, join, extname, basename } from '@tauri-apps/api/path';
import { xml2obj } from './xml-convert';
import { tracks, xmlData } from '$lib/stores/xml-obj.store';
import { logoPath } from '$lib/stores/global';
import { convertImageToDds } from './dds-parse';
import { get } from 'svelte/store';
import logger from '$lib/stores/logger';

export async function openFileDiag(args: {
	title: string;
	filters: DialogFilter[];
	multiple: boolean;
	defaultPath?: string;
}): Promise<object[] | any> {
	const { title, filters, multiple, defaultPath } = args;

	return open({ title, filters, multiple, directory: false, defaultPath });
}

export async function openDirDiag(args: { title: string }): Promise<string[] | any> {
	const { title } = args;

	return open({ title, directory: true, multiple: false, canCreateDirectories: true });
}

export async function openXML(file?: string | null): Promise<void> {
	if (!file) {
		file = await open({
			title: 'Import XML',
			defaultPath: 'station.xml',
			multiple: false,
			canCreateDirectories: false,
			filters: [{ extensions: ['xml'], name: 'XML Files' }]
		});
	}

	if (!file || typeof file !== 'string') return;

	const path = await dirname(file);

	const xmlString = await readTextFile(file);
	const parsed: XmlData = xml2obj(xmlString) as XmlData;

	// Ensure structure exists
	parsed.project = parsed.project ?? {
		fmod: '',
		radio: { id: '', name: '', logo: '', songs: [] }
	};
	parsed.project.radio.songs = Array.isArray(parsed.project.radio.songs)
		? parsed.project.radio.songs
		: [];

	if (parsed.project.radio.logo) {
		const absolute = await isAbsolute(parsed.project.radio.logo);
		if (!absolute) {
			logoPath.set(await join(path, parsed.project.radio.logo));
		} else {
			logoPath.set(parsed.project.radio.logo);
		}
	}

	if (parsed.project.radio.songs.length) {
		for (const { song } of parsed.project.radio.songs) {
			const absolute = await isAbsolute(song.file as string);

			if (!absolute) {
				song.file = await join(path, song.file as string);
			}
		}
	}

	xmlData.set(parsed);

	const songs: TrackXMLData[] = parsed.project.radio.songs.map((s) => s.song);
	tracks.set(songs);
}

export async function saveXML(xml: string, path: string) {
	const logo = get(logoPath);
	const logoName = await basename(logo);

	if (logo) {
		const imageExts = ['bmp', 'jpeg', 'jpg', 'png'];
		const dir = await dirname(path);
		const logoDir = await dirname(logo);

		const extension = await extname(logo);
		if (imageExts.some((ext) => extension === ext)) {
			convertImageToDds(logo, dir).catch((err) => logger.err(err));
		} else if (extension === 'dds') {
			if (logoDir !== dir && logoName !== 'thumb.dds')
				await copyFile(logo, await join(dir, 'thumb.dds'));
		}
	}

	return await writeTextFile(path, xml);
}
