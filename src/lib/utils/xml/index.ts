import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { XMLParser } from 'fast-xml-parser';
import z, { any, array, object, number, string, ZodIssueCode } from 'zod';
import { logger } from '$lib/utils';

const SongSchema = object({
	file: string(),
	artist: string().optional(),
	name: string().optional(),
	year: number().optional(),
	length: string().optional(),
	volume: number().optional(),
	force: number().optional()
});

const ProjectSchema = object({
	project: object({
		radio: object({
			id: string().optional(),
			name: string().optional(),
			jingles: object({
				file: array(string())
			}).optional(),
			songs: object({
				song: array(SongSchema).optional()
			}).optional()
		}).optional()
	})
});

function validateProjectXML(data: unknown): string[] {
	const messages: string[] = [];

	// --- 🚨 Fatal: missing <project> ---
	if (!(data as any)?.project) {
		return [`Missing required root "<project>" node.`];
	}

	// --- Run Zod ---
	const result = ProjectSchema.safeParse(data);

	// --- Collect Zod-derived issues ---
	const jinglesInvalid = new Set<number>();
	const songsInvalid = new Set<number>();

	if (!result.success) {
		for (const issue of result.error.issues) {
			const path = issue.path;

			// jingles.file[i]
			if (
				path.length >= 4 &&
				path[0] === 'project' &&
				path[1] === 'radio' &&
				path[2] === 'jingles' &&
				path[3] === 'file'
			) {
				const index = typeof path[4] === 'number' ? path[4] + 1 : 1;
				jinglesInvalid.add(index);
			}

			// songs.song[i].file
			if (
				path.length >= 5 &&
				path[0] === 'project' &&
				path[1] === 'radio' &&
				path[2] === 'songs' &&
				path[3] === 'song'
			) {
				const index = typeof path[4] === 'number' ? path[4] + 1 : 1;
				songsInvalid.add(index);
			}
		}
	}

	const project = (data as any).project;
	const radio = project?.radio;

	if (!radio) {
		// still return Zod errors if any (unlikely useful, but safe)
		return messages;
	}

	// --- 🎵 jingles: empty OR invalid ---
	if (radio.jingles?.file) {
		const files = Array.isArray(radio.jingles.file) ? radio.jingles.file : [radio.jingles.file];

		files.forEach((f: any, i: number) => {
			if (!f || String(f).trim() === '') {
				jinglesInvalid.add(i + 1);
			}
		});
	}

	if (jinglesInvalid.size > 0) {
		messages.push(
			`Empty "jingles" node(s): "<file>" at ${[...jinglesInvalid].sort((a, b) => a - b).join(', ')}.`
		);
	}

	// --- 🎶 songs: missing/empty OR invalid ---
	if (radio.songs?.song) {
		const songs = Array.isArray(radio.songs.song) ? radio.songs.song : [radio.songs.song];

		songs.forEach((song: any, i: number) => {
			if (!song?.file || String(song.file).trim() === '') {
				songsInvalid.add(i + 1);
			}
		});
	}

	if (songsInvalid.size > 0) {
		messages.push(
			`Missing or empty "song" node(s): "<file>" at ${[...songsInvalid].sort((a, b) => a - b).join(', ')}.`
		);
	}

	return messages;
}

async function importXML() {
	const file = await open({
		multiple: false,
		filters: [{ extensions: ['xml'], name: 'XML' }],
		title: 'Import XML'
	});

	if (file) {
		const rawXML = await readTextFile(file);

		const parser = new XMLParser();

		const parsedXML = parser.parse(rawXML);

		const errors = validateProjectXML(parsedXML);

		if (errors.length > 0) {
			logger.err(`Invalid XML data from file: ${file}`, errors);
			return;
		}
	}
}

export default importXML;
