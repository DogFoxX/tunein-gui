import { get, writable } from 'svelte/store';
import { xmlData } from './xml-obj.store';
import { openXML } from '$lib/utils/dialog';
import { join } from '@tauri-apps/api/path';
import { settings } from './settings.store';

export const logoPath = writable<string>();
export const stdOut = writable<string[]>([]);
export const unsaved = writable<boolean>();
export const updateAvailable = writable<boolean>();
export const profileData = writable<ProfileData>({
	force: {
		enable: false,
		value: '80'
	},
	targetVolume: {
		enable: false,
		value: '95'
	}
});
export const trackList = writable<TrackTableInfo[]>([]);

profileData.subscribe(async (data) => {
	if (data.radioData) {
		const xmlPath = await join(get(settings).cwd, data.name!, data.radioData!);
		await openXML(xmlPath);
	}

	if (data.trackData) {
		trackList.update((tracks) =>
			tracks.map((t, i) => ({
				...t,
				...(data.trackData ? { number: data.trackData[i]?.track.number } : {}),
				...(data.trackData ? { measured_volume: data.trackData[i]?.track.volume } : {})
			}))
		);
	}
});
