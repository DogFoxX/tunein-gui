import measureVolume from './measure-volume';
import getFiles from './recursive-scan';
import { readFile } from '@tauri-apps/plugin-fs';
import { parseBlob } from 'music-metadata';
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
	if (!year) return '';
	const str = String(year);
	const match = str.match(/\d{4}/);
	return match ? match[0] : '';
}

async function parseTracks(
	paths: string[],
	callback: (isLoading: boolean) => void,
	onTrackParsed?: (track: TrackTableInfo) => void
): Promise<TrackTableInfo[]> {
	callback(true);

	logger.info(`Loading Tracks 0 of ${paths.length}...`);

	const results: TrackTableInfo[] = [];

	for (const path of paths) {
		logger.update(`Loading Track {} of ${paths.length}...`, paths.indexOf(path) + 1);

		try {
			const bytes = await readFile(path);
			const blob = new Blob([bytes.buffer]);
			const meta = await parseBlob(blob);

			const track: TrackTableInfo = {
				id: crypto.randomUUID(),
				...(meta.common.track.no && meta.common.track.no !== 63
					? { number: meta.common.track.no.toString() }
					: {}),
				filename: getFileNameText(path),
				...(meta.common.artist ? { artist: meta.common.artist } : {}),
				...(meta.common.title ? { name: meta.common.title } : {}),
				...(meta.common.year ? { year: normalizeYear(meta.common.year) } : {}),
				...(meta.format.duration ? { length: formatDuration(meta.format.duration) } : {}),
				path
			};

			results.push(track);

			onTrackParsed?.(track);
		} catch (error) {
			logger.warn(`Failed to load track ${getFileNameText(path)}: ${String(error)}`);
		}

		if (paths.indexOf(path) + 1 === paths.length) {
			logger.update(`Loading Track {} of ${paths.length}... Done`, paths.indexOf(path) + 1);
			callback(false);
		}
	}

	return results;
}

export { measureVolume, getFiles };
export default parseTracks;
