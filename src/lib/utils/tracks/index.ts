import measureVolume from './measure-volume';
import getFiles from './recursive-scan';
import { readFile } from '@tauri-apps/plugin-fs';
import { parseBlob, type UnionOfParseErrors } from 'music-metadata';
import logger from '$lib/stores/logger';

function formatDuration(seconds: number): string {
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return [m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

function getFileNameText(path: string): string {
	return path.split(/[/\\]/).pop() ?? '';
}

function normalizeYear(year: number): string {
	const str = String(year);
	const match = str.match(/\d{4}/);
	return match ? match[0] : '';
}

async function parseTracks(
	paths: string[],
	callback: (isLoading: boolean) => void
): Promise<TrackTableInfo[]> {
	callback(true);

	logger.info(`Loading Tracks 0 of ${paths.length}...`);

	const results: TrackTableInfo[] = [];
	const failed: { path: string; error: string }[] = [];

	for (const path of paths) {
		logger.update(`Loading Track {} of ${paths.length}...`, paths.indexOf(path) + 1);

		try {
			const bytes = await readFile(path);
			const blob = new Blob([bytes.buffer]);
			const meta = await parseBlob(blob, { duration: true, skipPostHeaders: true });

			const track: TrackTableInfo = {
				id: crypto.randomUUID(),
				...(meta.common.track.no ? { number: meta.common.track.no.toString() } : {}),
				filename: getFileNameText(path),
				...(meta.common.artist ? { artist: meta.common.artist } : {}),
				...(meta.common.title ? { name: meta.common.title } : {}),
				...(meta.common.year ? { year: normalizeYear(meta.common.year) } : {}),
				...(meta.format.duration ? { length: formatDuration(meta.format.duration) } : {}),
				path
			};

			results.push(track);
		} catch (err: any) {
			const error = err as UnionOfParseErrors;
			failed.push({ path: getFileNameText(path), error: String(error.message) });
		}

		if (paths.indexOf(path) + 1 === paths.length) {
			logger.update(`Loading Track {} of ${paths.length}... Done`, paths.indexOf(path) + 1);
			callback(false);
		}
	}

	if (failed.length > 0) {
		logger.err(
			`Failed to parse ${failed.length} track(s):\n` +
				failed
					.map((f) => `\t- "${getFileNameText(f.path)}" - Reason: ${f.error}`)
					.join('\n')
		);
	}

	return results;
}

export { measureVolume, getFiles };
export default parseTracks;
