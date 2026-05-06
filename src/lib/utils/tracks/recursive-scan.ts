import { lstat, readDir } from '@tauri-apps/plugin-fs';
import { extname } from '@tauri-apps/api/path';
import { join } from '@tauri-apps/api/path';

const allowedExts = ['mp3', 'flac', 'ogg', 'wav'];

async function scanDirectoryRecursive(dirPath: string): Promise<string[]> {
	const entries = await readDir(dirPath);
	let results: string[] = [];

	for (const entry of entries) {
		const childPath = await join(dirPath, entry.name);

		if (entry.isFile) {
			const extension = await extname(childPath);

			if (allowedExts.some((ext) => extension == ext)) results.push(childPath);
		} else if (entry.isDirectory) {
			const nested = await scanDirectoryRecursive(childPath);

			results = results.concat(nested);
		}
	}

	return results;
}

async function getFiles(paths: string[]): Promise<string[]> {
	let results: string[] = [];

	for (const path of paths) {
		const info = await lstat(path);

		if (info.isFile) {
			const extension = await extname(path);

			if (allowedExts.some((ext) => extension == ext)) results.push(path);
		}

		if (info.isDirectory) {
			const nestedFiles = await scanDirectoryRecursive(path);
			results = results.concat(nestedFiles);
		}
	}

	if (!results.length) {
		throw Error('No supported files found.');
	}

	return results;
}

export default getFiles;
