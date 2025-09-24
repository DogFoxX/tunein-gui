import { writable, get } from 'svelte/store';

export const xmlData = writable<XmlData>({
	project: {
		fmod: '',
		radio: {
			id: '',
			name: '',
			logo: '',
			songs: []
		}
	}
});
export const tracks = writable<TrackData[]>([]);

xmlData.subscribe((data) => {
	const songs = data?.project?.radio?.songs ?? [];
	const currentTracks = get(tracks);

	const newTracks = songs.map((s) => s.song);
	if (JSON.stringify(currentTracks) !== JSON.stringify(newTracks)) {
		tracks.set(newTracks);
	}
});

export function updateTracks(newTracks: TrackData[]) {
	xmlData.update((d) => {
		if (!d?.project?.radio) return d;
		d.project.radio.songs = newTracks.map((song) => ({ song }));
		return d;
	});
}

export function updateTrack(index: number, field: keyof TrackData, value: string) {
	const currentTracks = get(tracks);
	const newTracks = [...currentTracks];
	newTracks[index] = { ...newTracks[index], [field]: value };
	updateTracks(newTracks);
}
