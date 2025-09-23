import { writable } from 'svelte/store';

export const xmlView = writable(true);

export const xmlValues = writable<XmlObj>({
	project: {
		fmod: '',
		radio: {
			id: '',
			name: '',
			logo: 'thumb.dds',
			songs: []
		}
	}
});

export const tracks = writable<MetadataResult[]>([]);

export const forceValue = writable<string>('0');

function toTrack(meta: MetadataResult): Track {
	return {
		file: meta.file ?? '',
		name: meta.name ?? '',
		artist: meta.artist ?? '',
		year: meta.year?.toString() ?? '',
		length: meta.length ?? ''
	};
}

tracks.subscribe((newTracks) => {
	xmlValues.update((state) => {
		// Only replace songs, keep id/name/logo untouched
		return {
			...state,
			project: {
				...state.project,
				radio: {
					...state.project.radio,
					songs: newTracks.map((trackMeta) => ({
						song: toTrack(trackMeta)
					}))
				}
			}
		};
	});
});

forceValue.subscribe((value) => {
	xmlValues.update((obj) => {
		const songs = obj.project.radio.songs ?? [];
		const updated = songs.map((s) => ({
			song: { ...s.song, force: value }
		}));

		return {
			...obj,
			project: {
				...obj.project,
				radio: { ...obj.project.radio, songs: updated }
			}
		};
	});
});
