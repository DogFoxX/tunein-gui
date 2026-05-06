import logger from '../logger';
import { invoke } from '@tauri-apps/api/core';

async function measureVolume(
	songs: SongsType[],
	callback: (isLoading: boolean) => void,
	onTrackMeasured?: (track: SongsType) => void
): Promise<SongsType[]> {
	callback(true);
	logger.info(`Analyzing Songs 0 of ${songs.length}...`);

	for (const song of songs) {
		logger.update(`Analyzing Song {} of ${songs.length}...`, songs.indexOf(song) + 1);

		try {
			const { volume } = await invoke<{ volume: number }>('get_volume', {
				pathStr: song.path
			});

			const measured_volume = volume.toFixed(1);

			song.measured_volume = measured_volume;

			onTrackMeasured?.(song);
		} catch (error) {
			logger.warn(`Failed to measure volume for ${song.filename}: ${String(error)}`);
		}

		if (songs.indexOf(song) + 1 === songs.length) {
			logger.update(`Analyzing song {} of ${songs.length}... Done`, songs.indexOf(song) + 1);
			callback(false);
		}

		// Optional: small yield for smoother UI rendering
		await new Promise((r) => setTimeout(r, 0));
	}

	return songs;
}

export default measureVolume;
