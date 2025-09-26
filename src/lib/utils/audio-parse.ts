import { readFile } from '@tauri-apps/plugin-fs';
import { parseBlob } from 'music-metadata';

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

function normalizeYear(year: number | undefined): string {
	if (!year) return ''; // no year info

	const str = String(year); // convert numbers to string
	const match = str.match(/\d{4}/); // extract first 4-digit sequence
	return match ? match[0] : '';
}

async function parseAudio(paths: string[]): Promise<TrackData[]> {
	const results = await Promise.all(
		paths.map(async (p, i) => {
			const bytes = await readFile(p);
			const blob = new Blob([bytes.buffer]);
			const meta = await parseBlob(blob);

			return {
				file: p,
				name: meta.common.title ?? getFileNameText(p),
				artist: meta.common.artist ?? '',
				year: normalizeYear(meta.common.year) ?? '',
				length: formatDuration(meta.format.duration)
			};
		})
	);

	return results;
}

export default parseAudio;
