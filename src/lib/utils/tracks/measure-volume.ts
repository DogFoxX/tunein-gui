import logger from '$lib/stores/logger';
import { invoke } from '@tauri-apps/api/core';

async function measureVolume(
	tracks: TrackTableInfo[],
	callback: (isLoading: boolean) => void,
	onTrackMeasured?: (track: TrackTableInfo) => void
): Promise<TrackTableInfo[]> {
	let index = 1;

	logger.info(`Analyzing Tracks 0 of ${tracks.length}...`);
	callback(true);

	for (const track of tracks) {
		logger.update(`Analyzing Track {} of ${tracks.length}...`, index);

		try {
			const { volume } = await invoke<{ volume: number }>('get_volume', {
				pathStr: track.path
			});

			track.measured_volume = volume;

			onTrackMeasured?.(track);
		} catch (error) {
			logger.warn(`Failed to measure volume for ${track.filename}: ${String(error)}`);
		}

		if (index === tracks.length) {
			logger.update(`Analyzing Track {} of ${tracks.length}... Done`, index);
			callback(false);
		}

		index++;

		// Optional: small yield for smoother UI rendering
		await new Promise((r) => setTimeout(r, 0));
	}

	return tracks;
}

export default measureVolume;
