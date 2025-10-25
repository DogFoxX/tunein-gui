import { open, type DialogFilter } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile, copyFile, exists } from '@tauri-apps/plugin-fs';
import { dirname, isAbsolute, join, extname, basename } from '@tauri-apps/api/path';
import { profile2obj, xmldata2obj } from './xml-convert';
import { xmlData } from '$lib/stores/xml-obj.store';
import { logoPath, trackList } from '$lib/stores/global';
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

export async function openProfile(file: string): Promise<ProfileData> {
	const xmlString = await readTextFile(file);
	return (await profile2obj(xmlString)) as ProfileData;
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
	const parsed: XmlData = xmldata2obj(xmlString) as XmlData;

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
			const logoFullPath = await join(path, parsed.project.radio.logo);
			(await exists(logoFullPath)) ? logoPath.set(logoFullPath) : logoPath.set('');
		} else {
			(await exists(parsed.project.radio.logo))
				? logoPath.set(parsed.project.radio.logo)
				: logoPath.set('');
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

	const songs: TrackTableInfo[] = parsed.project.radio.songs.map(({ song }, i) => ({
		id: crypto.randomUUID(),
		filename: song.file?.split(/[/\\]/).pop()!,
		name: song.name,
		artist: song.artist,
		year: song.year,
		length: song.length,
		path: song.file
	}));

	trackList.set(songs);
}

export async function saveProfile(xml: string, path: string) {
	return await writeTextFile(path, xml);
}

export async function saveXML(xml: string, path: string) {
	const logo = get(logoPath);

	if (logo) {
		const logoName = await basename(logo);
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
