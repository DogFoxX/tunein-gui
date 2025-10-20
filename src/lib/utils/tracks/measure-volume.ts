import logger from '$lib/stores/logger';
import { invoke } from '@tauri-apps/api/core';

async function measureVolume(
	tracks: TrackTableInfo[],
	callback: (isLoading: boolean) => void,
	onTrackMeasured?: (track: TrackTableInfo) => void
): Promise<TrackTableInfo[]> {
	logger.info(`Analyzing Tracks 0 of ${tracks.length}...`);
	callback(true);

	for (const track of tracks) {
		logger.update(`Analyzing Track {} of ${tracks.length}...`, tracks.indexOf(track) + 1);

		try {
			const { volume } = await invoke<{ volume: number }>('get_volume', {
				pathStr: track.path
			});

			track.measured_volume = volume.toFixed(1);

			onTrackMeasured?.(track);
		} catch (error) {
			logger.warn(`Failed to measure volume for ${track.filename}: ${String(error)}`);
		}

		if (tracks.indexOf(track) + 1 === tracks.length) {
			logger.update(
				`Analyzing Track {} of ${tracks.length}... Done`,
				tracks.indexOf(track) + 1
			);
			callback(false);
		}

		// Optional: small yield for smoother UI rendering
		await new Promise((r) => setTimeout(r, 0));
	}

	return tracks;
}

export default measureVolume;
