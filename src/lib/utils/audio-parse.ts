import logger from '$lib/stores/logger';
import { invoke } from '@tauri-apps/api/core';

function formatDuration(seconds?: number | undefined): string | null {
	if (seconds == null) return null;
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

function getFileNameText(path: string) {
	const base = path.split(/[/\\]/).pop() ?? '';
	return base.replace(/\.[^/.]+$/, '');
}

async function parseAudio(
	paths: string[],
	callback: (isLoading: boolean) => void,
	forceOpts?: { setForce: boolean; forceGlobVal: string }
): Promise<TrackData[]> {
	callback(true);
	// ...(forceOpts?.setForce ? { force: forceOpts.forceGlobVal } : {})

	const result = await invoke<TrackData[]>('get_audio_info', { paths, targetVolume: 92 });
	callback(false);
	return result;
}

export default parseAudio;
