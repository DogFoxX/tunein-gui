import { readFile } from '@tauri-apps/plugin-fs';
import { parseBlob } from 'music-metadata';

function formatDuration(seconds?: number | null): string | null {
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

function getFileName(path: string) {
	return path.split(/[/\\]/).pop();
}

async function parseAudio(paths: string[]): Promise<MetadataResult[]> {
	let text: string;

	const results = await Promise.all(
		paths.map(async (p, i) => {
			try {
				const bytes = await readFile(p);
				const blob = new Blob([bytes.buffer]);
				const meta = await parseBlob(blob);

				if (!meta.common.artist && !meta.common.title) {
					text = getFileNameText(p);
				} else text = `${meta.common.artist} - ${meta.common.title}`;

				return {
					id: i,
					file: p,
					text,
					name: meta.common.title ?? '',
					artist: meta.common.artist ?? '',
					year: meta.common.year ?? null,
					length: formatDuration(meta.format.duration)
				};
			} catch (err: any) {
				return { error: err.message };
			}
		})
	);

	return results;
}

export default parseAudio;
