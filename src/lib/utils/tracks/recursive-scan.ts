import { lstat, readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import logger from '$lib/stores/logger';

const allowedExts = ['.mp3', '.flac', '.ogg', '.wav'];
async function scanDirectoryRecursive(dirPath: string): Promise<string[]> {
	const entries = await readDir(dirPath);
	let results: string[] = [];

	for (const entry of entries) {
		const childPath = await join(dirPath, entry.name);

		if (entry.isFile && allowedExts.some((ext) => childPath.toLowerCase().endsWith(ext))) {
			results.push(childPath);
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

		if (info.isFile && allowedExts.some((ext) => path.toLowerCase().endsWith(ext))) {
			results.push(path);
		}

		if (info.isDirectory) {
			const nestedFiles = await scanDirectoryRecursive(path);
			results = results.concat(nestedFiles);
		}
	}

	return results;
}

export default getFiles;
