import { writable } from 'svelte/store';

export const xmlView = writable(true);

export const xmlData = writable<XmlData>({
	project: {
		fmod: '',
		radio: {
			songs: []
		}
	}
});

export const tracks = writable<TrackXMLData[]>([]);

export function updateTracks(newTracks: TrackXMLData[]) {
	xmlData.update((d) => {
		if (!d?.project?.radio) return d;
		d.project.radio.songs = newTracks.map((song) => ({ song }));
		return d;
	});
}

export function resetForce() {
	xmlData.update((data) => {
		if (!data?.project?.radio.songs) return data;

		const newTracks = data.project.radio.songs.map((item) => {
			const { force, ...rest } = item.song;
			return rest;
		});

		updateTracks(newTracks);
		return data;
	});
}
