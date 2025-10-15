import measureVolume from './measure-volume';
import { readFile } from '@tauri-apps/plugin-fs';
import { parseBlob } from 'music-metadata';
import logger from '$lib/stores/logger';

function formatDuration(seconds?: number): string | null {
	if (seconds == null) return null;
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return [m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

function getFileNameText(path: string): string {
	return path.split(/[/\\]/).pop() ?? '';
}

function normalizeYear(year: number | undefined): string {
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

	let index = 1;
	for (const path of paths) {
		logger.update(`Loading Track {} of ${paths.length}...`, index);

		try {
			const bytes = await readFile(path);
			const blob = new Blob([bytes.buffer]);
			const meta = await parseBlob(blob);

			const track: TrackTableInfo = {
				filename: getFileNameText(path),
				measured_volume: null,
				artist: meta.common.artist ?? '',
				name: meta.common.title ?? '',
				year: normalizeYear(meta.common.year),
				length: formatDuration(meta.format.duration),
				path
			};

			results.push(track);

			onTrackParsed?.(track);
		} catch (error) {
			logger.warn(`Failed to load track ${getFileNameText(path)}: ${String(error)}`);
		}

		if (index === paths.length) {
			logger.update(`Loading Track {} of ${paths.length}... Done`, index);
			callback(false);
		}

		index++;
	}

	return results;
}

export { measureVolume };
export default parseTracks;
